'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { format, endOfMonth } from 'date-fns'

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

  if (error) {
    console.error('Error fetching shifts:', error)
    throw new Error(`シフト取得エラー: ${error.message}`)
  }

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

  if (error) {
    console.error('Error fetching shifts by date range:', error)
    throw new Error(`シフト取得エラー: ${error.message}`)
  }

  return data as Shift[]
}

/**
 * シフトを作成
 */
export async function createShift(
  staffId: string,
  locationId: string,
  dutyCodeId: string,
  date: string,
  note?: string
): Promise<Shift> {
  const supabase = await createClient()
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('shifts')
    .insert({
      staff_id: staffId,
      location_id: locationId,
      duty_code_id: dutyCodeId,
      date,
      status: '予定',
      note: note || null,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating shift:', error)
    throw new Error(`シフト作成エラー: ${error.message}`)
  }

  revalidatePath('/shifts/create')
  return data as Shift
}

/**
 * シフトを更新
 */
export async function updateShift(
  shiftId: string,
  updates: {
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

  if (error) {
    console.error('Error updating shift:', error)
    throw new Error(`シフト更新エラー: ${error.message}`)
  }

  revalidatePath('/shifts/create')
  return data as Shift
}

/**
 * シフトを削除
 */
export async function deleteShift(shiftId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from('shifts').delete().eq('id', shiftId)

  if (error) {
    console.error('Error deleting shift:', error)
    throw new Error(`シフト削除エラー: ${error.message}`)
  }

  revalidatePath('/shifts/create')
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

  if (error) {
    console.error('Error fetching staff shift:', error)
    throw new Error(`シフト取得エラー: ${error.message}`)
  }

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

  if (error) {
    console.error('Error fetching shifts with details:', error)
    throw new Error(`シフト取得エラー: ${error.message}`)
  }

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

  if (fetchError) throw fetchError

  if (!shifts || shifts.length === 0) {
    throw new Error('確定対象のシフトが見つかりません')
  }

  // 確定済みシフトがある場合はエラー
  const alreadyConfirmed = shifts.filter((s) => s.status === '確定')
  if (alreadyConfirmed.length > 0) {
    throw new Error(`既に確定済みのシフトが含まれています（${alreadyConfirmed.length}件）`)
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

  if (updateError) throw updateError

  revalidatePath('/shifts')
  revalidatePath('/shifts/create')

  return { success: true, confirmedCount: shifts.length }
}

/**
 * 月次シフトを一括確定
 */
export async function confirmMonthShifts(yearMonth: string) {
  const supabase = await createClient()

  // 対象月の予定ステータスの全シフトIDを取得
  const { data: shifts } = await supabase
    .from('shifts')
    .select('id')
    .gte('date', `${yearMonth}-01`)
    .lt('date', `${yearMonth}-32`)
    .eq('status', '予定')

  if (!shifts || shifts.length === 0) {
    throw new Error('確定対象のシフトがありません')
  }

  const shiftIds = shifts.map((s) => s.id)

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

  if (error) throw error

  revalidatePath('/shifts')
  revalidatePath('/shifts/create')

  return { success: true }
}
