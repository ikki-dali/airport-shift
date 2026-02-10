'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isValid, parseISO } from 'date-fns'
import { canAssignStaff, type PositionRequirement } from '@/lib/ai/constraint-solver'
import { scoreStaffAssignment } from '@/lib/ai/scoring'
import type { StaffWithRole } from '@/lib/actions/staff'
import type { DutyCode } from '@/lib/actions/duty-codes'
import type { Shift } from '@/lib/actions/shifts'
import type { Shift as AIShift, ShiftRequest as AIShiftRequest } from '@/lib/ai/types'
import type { Database } from '@/types/database'
import { handleSupabaseError } from '@/lib/errors/helpers'
import { logger } from '@/lib/errors/logger'

type LocationRequirement = Database['public']['Tables']['location_requirements']['Row']

/**
 * スタッフ単位のプログレッシブ自動配置
 * 希望提出時に即座に呼ばれ、そのスタッフの◯希望日を最適なポジションに配置する
 */
export async function autoAssignForStaff(
  staffId: string,
  yearMonth: string
): Promise<{ assignedCount: number; skippedCount: number }> {
  try {
    const supabase = createServiceClient()

    // 1. そのスタッフの◯希望日を取得
    const [year, month] = yearMonth.split('-').map(Number)
    const startDate = `${yearMonth}-01`
    const lastDay = endOfMonth(new Date(year, month - 1))
    const endDate = format(lastDay, 'yyyy-MM-dd')

    const { data: requests, error: reqError } = await supabase
      .from('shift_requests')
      .select('*')
      .eq('staff_id', staffId)
      .gte('date', startDate)
      .lte('date', endDate)

    if (reqError) {
      logger.error('Failed to fetch shift requests', { error: reqError, staffId, yearMonth })
      return { assignedCount: 0, skippedCount: 0 }
    }

    // ◯希望のみ抽出
    const availableDates = (requests || [])
      .filter((r) => r.request_type === '◯')
      .map((r) => r.date)

    if (availableDates.length === 0) {
      return { assignedCount: 0, skippedCount: 0 }
    }

    // 2. そのスタッフの情報を取得
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
      .eq('id', staffId)
      .single()

    if (staffError || !staffData) {
      logger.error('Failed to fetch staff', { error: staffError, staffId })
      return { assignedCount: 0, skippedCount: 0 }
    }

    const staffMember: StaffWithRole = {
      ...staffData,
      roles: staffData.roles as any,
    }

    // 3. 月のポジション要件を生成
    const requirements = await generateMonthlyRequirementsForProgressive(yearMonth, supabase)

    if (requirements.length === 0) {
      return { assignedCount: 0, skippedCount: 0 }
    }

    // 4. 既存シフトを取得（その月の全シフト）
    const { data: existingShifts, error: shiftsError } = await supabase
      .from('shifts')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)

    if (shiftsError) {
      logger.error('Failed to fetch existing shifts', { error: shiftsError })
      return { assignedCount: 0, skippedCount: 0 }
    }

    const allShifts = (existingShifts || []) as Shift[]

    // 5. 全スタッフの希望を取得（スコアリング用）
    const { data: allRequests, error: allReqError } = await supabase
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

    if (allReqError) {
      logger.error('Failed to fetch all shift requests', { error: allReqError })
      return { assignedCount: 0, skippedCount: 0 }
    }

    // 6. 各◯希望日について最適なポジションを探す
    const shiftsToCreate: Array<{
      staff_id: string
      location_id: string
      duty_code_id: string
      date: string
      status: string
      note: string
    }> = []

    // mutableなシフトリスト（配置するたびに更新）
    const currentShifts = [...allShifts]

    for (const date of availableDates) {
      // このスタッフが既にその日にシフトがあるか確認
      const alreadyAssigned = currentShifts.some(
        (s) => s.staff_id === staffId && s.date === date
      )
      if (alreadyAssigned) continue

      // その日の空きポジションを探す
      const dayRequirements = requirements.filter((r) => r.date === date)

      let bestScore = -Infinity
      let bestRequirement: PositionRequirement | null = null

      for (const req of dayRequirements) {
        // 現在の配置数を確認
        const currentCount = currentShifts.filter(
          (s) =>
            s.date === date &&
            s.location_id === req.location_id &&
            s.duty_code_id === req.duty_code_id
        ).length

        // 空きがなければスキップ
        if (currentCount >= req.required_count) continue

        // 制約チェック
        const validation = canAssignStaff(
          staffMember,
          req,
          currentShifts as unknown as AIShift[]
        )
        if (!validation.isValid) continue

        // スコアリング
        const score = scoreStaffAssignment(
          staffMember,
          date,
          req.dutyCode,
          (allRequests || []) as unknown as AIShiftRequest[],
          currentShifts as unknown as AIShift[]
        )

        if (score > bestScore) {
          bestScore = score
          bestRequirement = req
        }
      }

      // 最適なポジションが見つかれば配置
      if (bestRequirement) {
        const newShift = {
          staff_id: staffId,
          location_id: bestRequirement.location_id,
          duty_code_id: bestRequirement.duty_code_id,
          date,
          status: '予定',
          note: 'AI自動配置',
        }
        shiftsToCreate.push(newShift)

        // mutableリストに追加（次の日の判定に使う）
        currentShifts.push({
          id: `temp-${date}`,
          ...newShift,
          version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: null,
          updated_by: null,
        } as Shift)
      }
    }

    // 7. バッチでDB保存
    if (shiftsToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('shifts')
        .insert(shiftsToCreate)

      if (insertError) {
        logger.error('Failed to insert auto-assigned shifts', { error: insertError })
        return { assignedCount: 0, skippedCount: availableDates.length }
      }

      revalidatePath('/shifts/create')
      revalidatePath('/shifts')
    }

    return {
      assignedCount: shiftsToCreate.length,
      skippedCount: availableDates.length - shiftsToCreate.length,
    }
  } catch (error) {
    logger.error('autoAssignForStaff failed', { error, staffId, yearMonth })
    return { assignedCount: 0, skippedCount: 0 }
  }
}

/**
 * プログレッシブ配置用の月次要件生成
 * auto-assign.tsのgenerateMonthlyRequirementsと同じロジックだが、
 * Service Clientを受け取る版
 */
async function generateMonthlyRequirementsForProgressive(
  yearMonth: string,
  supabase: ReturnType<typeof createServiceClient>
): Promise<PositionRequirement[]> {
  const [year, month] = yearMonth.split('-').map(Number)
  const monthStart = startOfMonth(new Date(year, month - 1))
  const monthEnd = endOfMonth(new Date(year, month - 1))
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // 場所一覧を取得
  const { data: locations, error: locationsError } = await supabase
    .from('locations')
    .select('id, business_type, location_name, code')
    .eq('is_active', true)

  if (locationsError || !locations || locations.length === 0) {
    return []
  }

  // 全ての場所要件を取得
  const { data: requirements, error: reqError } = await supabase
    .from('location_requirements')
    .select(`
      *,
      duty_codes (
        id,
        code,
        start_time,
        end_time,
        category,
        is_overnight,
        duration_hours,
        duration_minutes,
        break_minutes,
        total_hours
      )
    `)
    .in('location_id', locations.map((l) => l.id))

  if (reqError || !requirements || requirements.length === 0) {
    return []
  }

  // 日付×場所×勤務コードの組み合わせを生成
  const positionRequirements: PositionRequirement[] = []

  for (const day of daysInMonth) {
    const dateStr = format(day, 'yyyy-MM-dd')
    const dayOfWeek = getDay(day)

    for (const location of locations) {
      const applicableReqs = requirements.filter((req) => {
        if (req.location_id !== location.id) return false

        if (req.specific_date) {
          if (!isValid(parseISO(req.specific_date))) return false
          return req.specific_date === dateStr
        }

        if (req.day_of_week !== null) {
          return req.day_of_week === dayOfWeek
        }

        return true
      })

      for (const req of applicableReqs) {
        if (!req.duty_codes) continue

        positionRequirements.push({
          date: dateStr,
          location_id: location.id,
          duty_code_id: req.duty_code_id,
          dutyCode: {
            id: req.duty_codes.id,
            code: req.duty_codes.code,
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
