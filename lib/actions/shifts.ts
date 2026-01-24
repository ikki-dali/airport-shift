'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { format, endOfMonth } from 'date-fns'
import { ja } from 'date-fns/locale'
import { createBulkNotifications } from './notifications'
import { sendShiftConfirmationEmail } from '@/lib/email/send-shift-confirmation'
import { handleSupabaseError } from '@/lib/errors/helpers'
import { ValidationError } from '@/lib/errors'
import { logger } from '@/lib/errors/logger'

/**
 * 現在のユーザーIDを取得
 */
async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

export interface Shift {
  id: string
  staff_id: string
  location_id: string
  duty_code_id: string
  date: string
  status: '予定' | '確定' | '変更' | 'キャンセル'
  note: string | null
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
  const supabase = await createClient()
  const userId = await getCurrentUserId()

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

  if (typeof staffIdOrData === 'object') {
    // オブジェクト形式で呼び出された場合
    insertData = {
      staff_id: staffIdOrData.staff_id,
      location_id: staffIdOrData.location_id,
      duty_code_id: staffIdOrData.duty_code_id,
      date: staffIdOrData.date,
      status: '予定',
      note: staffIdOrData.note || null,
      created_by: userId,
      updated_by: userId,
    }
  } else {
    // 個別引数形式で呼び出された場合
    insertData = {
      staff_id: staffIdOrData,
      location_id: locationId!,
      duty_code_id: dutyCodeId!,
      date: date!,
      status: '予定',
      note: note || null,
      created_by: userId,
      updated_by: userId,
    }
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
 * シフトを更新
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
  }
): Promise<Shift> {
  const supabase = await createClient()
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('shifts')
    .update({
      ...updates,
      updated_by: userId,
    })
    .eq('id', shiftId)
    .select()
    .single()

  if (error) handleSupabaseError(error, { action: 'updateShift', entity: 'シフト' })

  revalidatePath('/shifts/create')
  return data as Shift
}

/**
 * シフトを削除
 */
export async function deleteShift(shiftId: string): Promise<void> {
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
 * シフトを確定する
 */
export async function confirmShifts(
  shiftIds: string[],
  options?: {
    skipWarnings?: boolean
  }
) {
  const supabase = await createClient()

  // 対象シフトを取得
  const { data: shifts, error: fetchError } = await supabase
    .from('shifts')
    .select('*, location:location_id(*), duty_code:duty_code_id(*), staff:staff_id(*, roles(*))')
    .in('id', shiftIds)

  if (fetchError) handleSupabaseError(fetchError, { action: 'confirmShifts', entity: 'シフト' })

  if (!shifts || shifts.length === 0) {
    throw new ValidationError('確定対象のシフトが見つかりません')
  }

  // 確定済みシフトがある場合はエラー
  const alreadyConfirmed = shifts.filter((s) => s.status === '確定')
  if (alreadyConfirmed.length > 0) {
    throw new ValidationError(`既に確定済みのシフトが含まれています（${alreadyConfirmed.length}件）`)
  }

  // ステータスを「確定」に変更
  const userId = await getCurrentUserId()
  const { error: updateError } = await supabase
    .from('shifts')
    .update({
      status: '確定',
      updated_by: userId,
    })
    .in('id', shiftIds)

  if (updateError) handleSupabaseError(updateError, { action: 'confirmShifts', entity: 'シフト' })

  // 通知を作成
  try {
    const staffIds = [...new Set(shifts.map((s: any) => s.staff_id))]
    await createBulkNotifications(staffIds, {
      type: 'shift_confirmed',
      title: 'シフトが確定されました',
      message: `${shifts.length}件のシフトが確定されました。確認してください。`,
    })
  } catch (notificationError) {
    logger.error('Notification creation failed (non-blocking)', { action: 'confirmShifts' }, notificationError)
  }

  // メール送信
  try {
    // スタッフごとにグループ化してメール送信
    const staffGroups = shifts.reduce((acc: any, shift: any) => {
      const staffId = shift.staff_id
      if (!acc[staffId]) {
        acc[staffId] = {
          staff: shift.staff,
          count: 0,
        }
      }
      acc[staffId].count++
      return acc
    }, {})

    // 各スタッフに順次メール送信（レート制限対策：1秒に2リクエストまで）
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

          // レート制限対策：500ms待機（1秒に2リクエストまで）
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
  } catch (emailError) {
    logger.error('Email sending failed (non-blocking)', { action: 'confirmShifts' }, emailError)
  }

  revalidatePath('/shifts')
  revalidatePath('/shifts/create')

  return { success: true, confirmedCount: shifts.length }
}

/**
 * 月次シフトを一括確定
 */
export async function confirmMonthShifts(yearMonth: string) {
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
  const supabase = await createClient()
  const userId = await getCurrentUserId()

  const { error } = await supabase
    .from('shifts')
    .update({
      status: '予定',
      updated_by: userId,
    })
    .in('id', shiftIds)

  if (error) handleSupabaseError(error, { action: 'unconfirmShifts', entity: 'シフト' })

  revalidatePath('/shifts')
  revalidatePath('/shifts/create')

  return { success: true }
}
