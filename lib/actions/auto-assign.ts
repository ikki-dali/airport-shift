'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isValid, parseISO } from 'date-fns'
import { optimizeShiftAssignments, type OptimizationResult } from '@/lib/ai/shift-optimizer'
import { type PositionRequirement } from '@/lib/ai/constraint-solver'
import type { StaffWithRole } from '@/lib/actions/staff'
import type { DutyCode } from '@/lib/actions/duty-codes'
import type { Location } from '@/lib/actions/locations'
import type { Shift } from '@/lib/actions/shifts'
import type { Database } from '@/types/database'

type LocationRequirement = Database['public']['Tables']['location_requirements']['Row']

interface AutoAssignInput {
  yearMonth: string // "YYYY-MM"
  locationIds?: string[] // 空の場合は全ての場所
  overwriteExisting?: boolean // 既存のシフトを上書きするか
}

interface AutoAssignPreviewResult extends OptimizationResult {
  warnings: string[]
  conflicts: Array<{
    date: string
    location_id: string
    duty_code_id: string
    message: string
  }>
}

/**
 * 月全体のシフト要件を生成
 */
async function generateMonthlyRequirements(
  yearMonth: string,
  locationIds?: string[]
): Promise<PositionRequirement[]> {
  const supabase = await createClient()

  // 月の日付一覧を取得
  const [year, month] = yearMonth.split('-').map(Number)
  const monthStart = startOfMonth(new Date(year, month - 1))
  const monthEnd = endOfMonth(new Date(year, month - 1))
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // 場所一覧を取得
  let locationsQuery = supabase
    .from('locations')
    .select('id, business_type, location_name, code')
    .eq('is_active', true)

  if (locationIds && locationIds.length > 0) {
    locationsQuery = locationsQuery.in('id', locationIds)
  }

  const { data: locations, error: locationsError } = await locationsQuery
  if (locationsError) throw locationsError
  if (!locations) throw new Error('Locations not found')

  // 全ての場所要件を取得
  const { data: requirements, error: reqError } = await supabase
    .from('location_requirements')
    .select(`
      *,
      duty_codes (
        id,
        code,
        name,
        start_time,
        end_time,
        category
      )
    `)
    .in('location_id', locations.map((l) => l.id))

  if (reqError) throw reqError
  if (!requirements) throw new Error('Requirements not found')

  // 日付×場所×勤務コードの組み合わせを生成
  const positionRequirements: PositionRequirement[] = []

  for (const day of daysInMonth) {
    const dateStr = format(day, 'yyyy-MM-dd')
    const dayOfWeek = getDay(day) // 0=日曜, 6=土曜

    for (const location of locations) {
      // この日付・場所に適用される要件を抽出
      const applicableReqs = requirements.filter((req) => {
        if (req.location_id !== location.id) return false

        // 特定日指定がある場合
        if (req.specific_date) {
          // 不正な日付をスキップ（例: 2025-11-31）
          if (!isValid(parseISO(req.specific_date))) {
            console.warn(`Invalid specific_date in requirement: ${req.specific_date}`)
            return false
          }
          return req.specific_date === dateStr
        }

        // 曜日指定がある場合
        if (req.day_of_week !== null) {
          return req.day_of_week === dayOfWeek
        }

        // どちらも指定がない場合は全ての日に適用
        return true
      })

      // 各勤務コードに対して要件を作成
      for (const req of applicableReqs) {
        if (!req.duty_codes) continue

        positionRequirements.push({
          date: dateStr,
          location_id: location.id,
          duty_code_id: req.duty_code_id,
          dutyCode: {
            id: req.duty_codes.id,
            code: req.duty_codes.code,
            name: req.duty_codes.name,
            start_time: req.duty_codes.start_time,
            end_time: req.duty_codes.end_time,
            category: req.duty_codes.category,
          } as DutyCode,
          required_count: req.required_staff_count,
          requires_responsible: req.required_responsible_count > 0,
          required_tags: req.required_tags || [],
        })
      }
    }
  }

  return positionRequirements
}

/**
 * AI自動割り当てのプレビュー（DBに保存しない）
 */
export async function previewAutoAssign(
  input: AutoAssignInput
): Promise<AutoAssignPreviewResult> {
  const supabase = await createClient()

  // 月の要件を生成
  const requirements = await generateMonthlyRequirements(
    input.yearMonth,
    input.locationIds
  )

  if (requirements.length === 0) {
    throw new Error('対象期間・場所に有効な要件が設定されていません')
  }

  // スタッフリストを取得
  const { data: staffData, error: staffError } = await supabase
    .from('staff')
    .select(`
      *,
      roles (
        id,
        name,
        is_responsible,
        priority
      )
    `)
    .eq('is_active', true)

  if (staffError) throw staffError

  // StaffWithRole型に変換（is_responsibleを追加）
  const allStaff: StaffWithRole[] = staffData.map((s) => ({
    ...s,
    roles: s.roles as any,
  }))

  // シフト希望を取得
  const [year, month] = input.yearMonth.split('-')
  const startDate = `${input.yearMonth}-01`
  const lastDay = endOfMonth(new Date(parseInt(year), parseInt(month) - 1))
  const endDate = format(lastDay, 'yyyy-MM-dd')

  const { data: shiftRequests, error: requestsError } = await supabase
    .from('shift_requests')
    .select(`
      *,
      staff (
        id,
        employee_number,
        name
      )
    `)
    .gte('date', startDate)
    .lte('date', endDate)

  if (requestsError) throw requestsError

  // 既存のシフトを取得（上書きしない場合は考慮する）
  const { data: existingShifts, error: shiftsError } = await supabase
    .from('shifts')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)

  if (shiftsError) throw shiftsError

  // 最適化実行
  const result = await optimizeShiftAssignments(
    requirements,
    allStaff,
    shiftRequests as any,
    {
      applyLocalSearch: true,
      maxLocalSearchIterations: 100,
      timeoutMs: 30000,
    }
  )

  // 警告とコンフリクトを検出
  const warnings: string[] = []
  const conflicts: Array<{
    date: string
    location_id: string
    duty_code_id: string
    message: string
  }> = []

  // 既存シフトとのコンフリクトチェック
  if (!input.overwriteExisting && existingShifts.length > 0) {
    for (const newShift of result.assignments) {
      const existing = existingShifts.find(
        (e) =>
          e.date === newShift.date &&
          e.location_id === newShift.location_id &&
          e.duty_code_id === newShift.duty_code_id
      )

      if (existing) {
        conflicts.push({
          date: newShift.date,
          location_id: newShift.location_id,
          duty_code_id: newShift.duty_code_id,
          message: `既存のシフトが存在します（スタッフ: ${existing.staff_id}）`,
        })
      }
    }
  }

  // 希望充足率が低い場合の警告
  if (result.stats.fulfillmentRate < 70) {
    warnings.push(
      `希望充足率が低いです（${result.stats.fulfillmentRate}%）。要件の見直しが必要かもしれません。`
    )
  }

  // 勤務日数のばらつきが大きい場合の警告
  if (result.stats.workDaysStdDev > 3) {
    warnings.push(
      `勤務日数のばらつきが大きいです（標準偏差: ${result.stats.workDaysStdDev}日）`
    )
  }

  return {
    ...result,
    warnings,
    conflicts,
  }
}

/**
 * AI自動割り当てを実行してDBに保存
 */
export async function executeAutoAssign(
  input: AutoAssignInput
): Promise<{
  success: boolean
  createdCount: number
  result: OptimizationResult
}> {
  const supabase = await createClient()

  // プレビューを実行
  const preview = await previewAutoAssign(input)

  // コンフリクトがある場合は確認が必要
  if (preview.conflicts.length > 0 && !input.overwriteExisting) {
    throw new Error(
      `既存のシフトとの競合が${preview.conflicts.length}件あります。上書きオプションを有効にするか、既存シフトを削除してください。`
    )
  }

  // 検証エラーがある場合は中止
  if (!preview.validation.isValid) {
    throw new Error(
      `制約違反が検出されました:\n${preview.validation.errors.join('\n')}`
    )
  }

  // 既存シフトを削除（上書きの場合）
  if (input.overwriteExisting) {
    const [year, month] = input.yearMonth.split('-')
    const startDate = `${input.yearMonth}-01`
    const lastDay = endOfMonth(new Date(parseInt(year), parseInt(month) - 1))
    const endDate = format(lastDay, 'yyyy-MM-dd')

    let deleteQuery = supabase
      .from('shifts')
      .delete()
      .gte('date', startDate)
      .lte('date', endDate)

    if (input.locationIds && input.locationIds.length > 0) {
      deleteQuery = deleteQuery.in('location_id', input.locationIds)
    }

    const { error: deleteError } = await deleteQuery
    if (deleteError) throw deleteError
  }

  // シフトを一括作成
  const shiftsToCreate = preview.assignments.map((assignment) => ({
    staff_id: assignment.staff_id,
    location_id: assignment.location_id,
    duty_code_id: assignment.duty_code_id,
    date: assignment.date,
    status: '予定' as const,
    note: 'AI自動割り当て',
  }))

  const { data, error } = await supabase
    .from('shifts')
    .insert(shiftsToCreate)
    .select()

  if (error) {
    console.error('Auto-assign insert error:', error)
    throw new Error(`シフト作成エラー: ${error.message}`)
  }

  revalidatePath('/shifts/create')
  revalidatePath(`/shifts`)

  return {
    success: true,
    createdCount: data.length,
    result: preview,
  }
}

/**
 * 部分的な自動割り当て（特定の日付範囲や場所のみ）
 */
export async function executePartialAutoAssign(input: {
  yearMonth: string
  dateRange?: { start: string; end: string }
  locationIds?: string[]
  dutyCodeIds?: string[]
  overwriteExisting?: boolean
}): Promise<{
  success: boolean
  createdCount: number
  result: OptimizationResult
}> {
  // 基本的にはexecuteAutoAssignと同じだが、フィルタリングを追加
  // 実装は簡略化のため後で追加
  return executeAutoAssign({
    yearMonth: input.yearMonth,
    locationIds: input.locationIds,
    overwriteExisting: input.overwriteExisting,
  })
}
