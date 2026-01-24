'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { format, endOfMonth } from 'date-fns'
import { ja } from 'date-fns/locale'
import { createBulkNotifications } from './notifications'
import { sendShiftConfirmationEmail } from '@/lib/email/send-shift-confirmation'
import { handleSupabaseError } from '@/lib/errors/helpers'
import { ValidationError, ConflictError } from '@/lib/errors'
import { logger } from '@/lib/errors/logger'
import { requireAuth } from '@/lib/auth'
import { validateData, shiftCreateSchema, shiftUpdateSchema } from '@/lib/validators/schemas'

export interface Shift {
  id: string
  staff_id: string
  location_id: string
  duty_code_id: string
  date: string
  status: '予定' | '確定' | '変更' | 'キャンセル'
  note: string | null
  version: number
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

/**
 * シフト一覧を取得（月次フィルター）
 */
export async function getShifts(yearMonth?: string): Promise<Shift[]> {
  const supabase = await createClient()

  let query = supabase
    .from('shifts')
    .select('*')
    .order('date', { ascending: true })

  // 年月フィルター（YYYY-MM形式）
  if (yearMonth) {
    const [year, month] = yearMonth.split('-')
    const startDate = `${yearMonth}-01`
    const lastDay = endOfMonth(new Date(parseInt(year), parseInt(month) - 1))
    const endDate = format(lastDay, 'yyyy-MM-dd')
    query = query.gte('date', startDate).lte('date', endDate)
  }

  const { data, error } = await query

  if (error) handleSupabaseError(error, { action: 'getShifts', entity: 'シフト' })

  return data as Shift[]
}

/**
 * 指定期間のシフトを取得
 */
export async function getShiftsByDateRange(
  startDate: string,
  endDate: string
): Promise<Shift[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (error) handleSupabaseError(error, { action: 'getShiftsByDateRange', entity: 'シフト' })

  return data as Shift[]
}

/**
 * シフトを作成（オーバーロード対応）
 */
export async function createShift(
  data: {
    staff_id: string
    location_id: string
    duty_code_id: string
    date: string
    note?: string
  }
): Promise<Shift>
export async function createShift(
  staffId: string,
  locationId: string,
  dutyCodeId: string,
  date: string,
  note?: string
): Promise<Shift>
export async function createShift(
  staffIdOrData: string | {
    staff_id: string
    location_id: string
    duty_code_id: string
    date: string
    note?: string
  },
  locationId?: string,
  dutyCodeId?: string,
  date?: string,
  note?: string
): Promise<Shift> {
  const user = await requireAuth()
  const supabase = await createClient()

  let insertData: {
    staff_id: string
    location_id: string
    duty_code_id: string
    date: string
    note: string | null
    status: string
    created_by: string | null
    updated_by: string | null
  }

  // 入力データを正規化
  const rawData = typeof staffIdOrData === 'object'
    ? staffIdOrData
    : { staff_id: staffIdOrData, location_id: locationId!, duty_code_id: dutyCodeId!, date: date!, note: note }

  // バリデーション
  const validated = validateData(shiftCreateSchema, rawData)

  insertData = {
    staff_id: validated.staff_id,
    location_id: validated.location_id,
    duty_code_id: validated.duty_code_id,
    date: validated.date,
    status: '予定',
    note: validated.note || null,
    created_by: user.id,
    updated_by: user.id,
  }

  // 既存のシフトをチェック
  const existingShift = await getStaffShiftByDate(insertData.staff_id, insertData.date)
  
  // 既に同じスタッフが同じ日にシフトを持っている場合は、既存のシフトを返す
  if (existingShift) {
    logger.info('Shift already exists, returning existing', { action: 'createShift', staffId: insertData.staff_id, date: insertData.date })
    return existingShift
  }

  const { data: result, error } = await supabase
    .from('shifts')
    .insert(insertData)
    .select()
    .single()

  if (error) handleSupabaseError(error, { action: 'createShift', entity: 'シフト' })

  revalidatePath('/shifts/create')
  return result as Shift
}

/**
 * シフトを更新（楽観的ロック対応）
 * expectedVersionを指定すると、DBのversionと一致しない場合にConflictErrorをスロー
 */
export async function updateShift(
  shiftId: string,
  updates: {
    staff_id?: string
    location_id?: string
    duty_code_id?: string
    date?: string
    status?: '予定' | '確定' | '変更' | 'キャンセル'
    note?: string | null
  },
  expectedVersion?: number
): Promise<Shift> {
  const user = await requireAuth()

  // バリデーション
  const validated = validateData(shiftUpdateSchema, updates)

  const supabase = await createClient()

  let query = supabase
    .from('shifts')
    .update({
      ...validated,
      updated_by: user.id,
    })
    .eq('id', shiftId)

  // 楽観的ロック: versionが指定されていれば一致チェック
  if (expectedVersion !== undefined) {
    query = query.eq('version', expectedVersion)
  }

  const { data, error } = await query.select().single()

  if (error) {
    // PGRST116: .single()で0行返却（version不一致 = 他ユーザーが更新済み）
    if (error.code === 'PGRST116' && expectedVersion !== undefined) {
      throw new ConflictError(
        '他のユーザーによってシフトが更新されています。画面を更新してから再度お試しください。',
        { shiftId, expectedVersion, action: 'updateShift' }
      )
    }
    handleSupabaseError(error, { action: 'updateShift', entity: 'シフト' })
  }

  revalidatePath('/shifts/create')
  return data as Shift
}

/**
 * シフトを削除
 */
export async function deleteShift(shiftId: string): Promise<void> {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase.from('shifts').delete().eq('id', shiftId)

  if (error) handleSupabaseError(error, { action: 'deleteShift', entity: 'シフト' })

  revalidatePath('/shifts/create')
}

/**
 * 指定期間のスタッフのシフトを一括削除
 */
export async function deleteStaffShiftsByDateRange(
  staffId: string,
  startDate: string,
  endDate: string
): Promise<{ deletedCount: number }> {
  await requireAuth()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('shifts')
    .delete()
    .eq('staff_id', staffId)
    .gte('date', startDate)
    .lte('date', endDate)
    .select()

  if (error) handleSupabaseError(error, { action: 'deleteStaffShiftsByDateRange', entity: 'シフト' })

  revalidatePath('/shifts/create')
  return { deletedCount: data?.length || 0 }
}

/**
 * スタッフの特定日のシフトを取得
 */
export async function getStaffShiftByDate(
  staffId: string,
  date: string
): Promise<Shift | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('staff_id', staffId)
    .eq('date', date)
    .maybeSingle()

  if (error) handleSupabaseError(error, { action: 'getStaffShiftByDate', entity: 'シフト' })

  return data as Shift | null
}

/**
 * シフト一覧を詳細情報付きで取得
 */
export async function getShiftsWithDetails(filters?: {
  yearMonth?: string
  status?: '予定' | '確定' | '変更' | 'キャンセル'
  staffId?: string
  locationId?: string
  startDate?: string
  endDate?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('shifts')
    .select(`
      *,
      staff:staff_id (
        id,
        employee_number,
        name,
        role_id,
        roles (
          id,
          name,
          is_responsible
        )
      ),
      location:location_id (
        id,
        business_type,
        location_name,
        code
      ),
      duty_code:duty_code_id (
        id,
        code,
        start_time,
        end_time,
        duration_hours,
        duration_minutes,
        category
      )
    `)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true })

  if (filters?.yearMonth) {
    const [year, month] = filters.yearMonth.split('-')
    const startDate = `${filters.yearMonth}-01`
    const lastDay = endOfMonth(new Date(parseInt(year), parseInt(month) - 1))
    const endDate = format(lastDay, 'yyyy-MM-dd')
    query = query.gte('date', startDate).lte('date', endDate)
  }

  if (filters?.startDate) {
    query = query.gte('date', filters.startDate)
  }

  if (filters?.endDate) {
    query = query.lte('date', filters.endDate)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.staffId) {
    query = query.eq('staff_id', filters.staffId)
  }

  if (filters?.locationId) {
    query = query.eq('location_id', filters.locationId)
  }

  const { data, error } = await query

  if (error) handleSupabaseError(error, { action: 'getShiftsWithDetails', entity: 'シフト' })

  return data
}

/**
 * シフトを確定する（RPC経由のトランザクション処理）
 * バリデーション→行ロック→更新をDB側で一括実行し、途中エラー時は全体ロールバック
 */
export async function confirmShifts(
  shiftIds: string[],
  options?: {
    skipWarnings?: boolean
  }
) {
  const user = await requireAuth()
  const supabase = await createClient()

  // RPC呼び出し（トランザクション内でバリデーション+更新を実行）
  const { data: rpcResult, error: rpcError } = await supabase
    .rpc('confirm_shifts', {
      p_shift_ids: shiftIds,
      p_updated_by: user.id,
    })

  if (rpcError) {
    // RPC内のバリデーションエラーを判別
    if (rpcError.message?.includes('VALIDATION:')) {
      const cleanMessage = rpcError.message.replace(/^.*VALIDATION:\s*/, '')
      throw new ValidationError(cleanMessage)
    }
    handleSupabaseError(rpcError, { action: 'confirmShifts', entity: 'シフト' })
  }

  const confirmedCount = rpcResult?.[0]?.confirmed_count ?? shiftIds.length

  // 確定済みシフトの詳細を取得（通知・メール用、トランザクション外）
  const { data: shifts } = await supabase
    .from('shifts')
    .select('*, location:location_id(*), duty_code:duty_code_id(*), staff:staff_id(*, roles(*))')
    .in('id', shiftIds)

  // 通知を作成（非ブロッキング）
  try {
    if (shifts && shifts.length > 0) {
      const staffIds = [...new Set(shifts.map((s: any) => s.staff_id))]
      await createBulkNotifications(staffIds, {
        type: 'shift_confirmed',
        title: 'シフトが確定されました',
        message: `${confirmedCount}件のシフトが確定されました。確認してください。`,
      })
    }
  } catch (notificationError) {
    logger.error('Notification creation failed (non-blocking)', { action: 'confirmShifts' }, notificationError)
  }

  // メール送信（非ブロッキング）
  try {
    if (shifts && shifts.length > 0) {
      const staffGroups = shifts.reduce((acc: any, shift: any) => {
        const staffId = shift.staff_id
        if (!acc[staffId]) {
          acc[staffId] = { staff: shift.staff, count: 0 }
        }
        acc[staffId].count++
        return acc
      }, {})

      let sentCount = 0
      let errorCount = 0

      for (const [, data] of Object.entries(staffGroups)) {
        const staff = (data as any).staff
        const count = (data as any).count

        if (staff.email && staff.request_token) {
          try {
            await sendShiftConfirmationEmail({
              to: staff.email,
              staffName: staff.name,
              token: staff.request_token,
              shiftCount: count,
            })
            sentCount++
            logger.info(`Email sent to ${staff.name}`, { action: 'confirmShifts', email: staff.email })
            await new Promise(resolve => setTimeout(resolve, 500))
          } catch (emailErr: unknown) {
            errorCount++
            logger.error(`Failed to send email to ${staff.name}`, { action: 'confirmShifts' }, emailErr)
          }
        } else {
          logger.info(`Skipped ${staff.name}: no email or token`, { action: 'confirmShifts' })
        }
      }

      logger.info(`Email sending completed: ${sentCount} sent, ${errorCount} failed`, { action: 'confirmShifts' })
    }
  } catch (emailError) {
    logger.error('Email sending failed (non-blocking)', { action: 'confirmShifts' }, emailError)
  }

  revalidatePath('/shifts')
  revalidatePath('/shifts/create')

  return { success: true, confirmedCount }
}

/**
 * 月次シフトを一括確定
 */
export async function confirmMonthShifts(yearMonth: string) {
  await requireAuth()
  const supabase = await createClient()

  // 対象月の開始日と終了日を計算
  const [year, month] = yearMonth.split('-')
  const startDate = `${yearMonth}-01`
  const lastDay = endOfMonth(new Date(parseInt(year), parseInt(month) - 1))
  const endDate = format(lastDay, 'yyyy-MM-dd')

  // 対象月の予定ステータスの全シフトIDを取得
  const { data: shifts } = await supabase
    .from('shifts')
    .select('id')
    .gte('date', startDate)
    .lte('date', endDate)
    .eq('status', '予定')

  if (!shifts || shifts.length === 0) {
    throw new ValidationError('確定対象のシフトがありません')
  }

  const shiftIds = shifts.map((s: { id: string }) => s.id)

  return confirmShifts(shiftIds)
}

/**
 * シフトの確定を解除（管理者用）
 */
export async function unconfirmShifts(shiftIds: string[]) {
  const user = await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase
    .from('shifts')
    .update({
      status: '予定',
      updated_by: user.id,
    })
    .in('id', shiftIds)

  if (error) handleSupabaseError(error, { action: 'unconfirmShifts', entity: 'シフト' })

  revalidatePath('/shifts')
  revalidatePath('/shifts/create')

  return { success: true }
}
