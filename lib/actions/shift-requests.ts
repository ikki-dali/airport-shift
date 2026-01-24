'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'
import type { ParsedRequest } from '@/lib/parsers/excel-parser'
import { handleSupabaseError } from '@/lib/errors/helpers'
import { ValidationError } from '@/lib/errors'
import { requireAuth } from '@/lib/auth'

type ShiftRequest = Database['public']['Tables']['shift_requests']['Row']

export type ShiftRequestWithStaff = ShiftRequest & {
  staff: {
    id: string
    employee_number: string
    name: string
  } | null
}

export async function getShiftRequests(filters?: {
  yearMonth?: string
  staffId?: string
  date?: string
}): Promise<ShiftRequestWithStaff[]> {
  const supabase = await createClient()

  let query = supabase
    .from('shift_requests')
    .select(`
      *,
      staff (
        id,
        employee_number,
        name
      )
    `)
    .order('date', { ascending: true })

  if (filters?.yearMonth) {
    // 月の最初と最後の日を正しく計算
    const year = parseInt(filters.yearMonth.split('-')[0])
    const month = parseInt(filters.yearMonth.split('-')[1])
    const startDate = `${filters.yearMonth}-01`
    // 次の月の0日 = 今月の最終日
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${filters.yearMonth}-${String(lastDay).padStart(2, '0')}`
    query = query.gte('date', startDate).lte('date', endDate)
  }

  if (filters?.date) {
    query = query.eq('date', filters.date)
  }

  if (filters?.staffId) {
    query = query.eq('staff_id', filters.staffId)
  }

  const { data, error } = await query

  if (error) handleSupabaseError(error, { action: 'getShiftRequests', entity: 'シフト希望' })
  return data as ShiftRequestWithStaff[]
}

export async function importShiftRequests(
  requests: ParsedRequest[],
  yearMonth: string,
  overwrite: boolean = false
) {
  await requireAuth()
  const supabase = await createClient()

  // 既存データのチェック
  const year = parseInt(yearMonth.split('-')[0])
  const month = parseInt(yearMonth.split('-')[1])
  const startDate = `${yearMonth}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${yearMonth}-${String(lastDay).padStart(2, '0')}`

  const { count } = await supabase
    .from('shift_requests')
    .select('id', { count: 'exact', head: true })
    .gte('date', startDate)
    .lte('date', endDate)

  if (count && count > 0 && !overwrite) {
    throw new ValidationError(
      `${yearMonth}の希望データが既に${count}件存在します。上書きする場合は上書きオプションを選択してください。`
    )
  }

  // 上書きの場合、既存データを削除
  if (overwrite && count && count > 0) {
    const { error: deleteError } = await supabase
      .from('shift_requests')
      .delete()
      .gte('date', startDate)
      .lte('date', endDate)

    if (deleteError) handleSupabaseError(deleteError, { action: 'importShiftRequests', entity: 'シフト希望' })
  }

  // データ変換
  const shiftRequests = requests.map((req) => ({
    staff_id: req.staffId,
    date: req.date,
    request_type: req.requestType,
  }))

  // 一括挿入（Supabaseは最大1000件まで）
  const batchSize = 1000
  let insertedCount = 0

  for (let i = 0; i < shiftRequests.length; i += batchSize) {
    const batch = shiftRequests.slice(i, i + batchSize)
    const { error } = await supabase.from('shift_requests').insert(batch)

    if (error) {
      handleSupabaseError(error, { action: 'importShiftRequests', entity: 'シフト希望' })
    }

    insertedCount += batch.length
  }

  revalidatePath('/requests')
  return { insertedCount, overwrittenCount: overwrite ? count || 0 : 0 }
}

export async function deleteShiftRequestsByYearMonth(yearMonth: string) {
  await requireAuth()
  const supabase = await createClient()

  const year = parseInt(yearMonth.split('-')[0])
  const month = parseInt(yearMonth.split('-')[1])
  const startDate = `${yearMonth}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${yearMonth}-${String(lastDay).padStart(2, '0')}`

  const { error } = await supabase
    .from('shift_requests')
    .delete()
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) handleSupabaseError(error, { action: 'deleteShiftRequestsByYearMonth', entity: 'シフト希望' })

  revalidatePath('/requests')
}

export async function bulkUpsertShiftRequests(
  requests: Array<{
    staff_id: string
    date: string
    request_type: '◯' | '休' | '早朝' | '早番' | '遅番' | '夜勤'
    note?: string
  }>
) {
  await requireAuth()
  const supabase = await createClient()

  // 年月を計算（最初のリクエストから）
  const yearMonth = requests[0]?.date.substring(0, 7)

  // データに year_month を追加
  const requestsWithYearMonth = requests.map((req) => ({
    ...req,
    year_month: req.date.substring(0, 7),
  }))

  // upsert（存在すれば更新、なければ挿入）
  const { data, error } = await supabase
    .from('shift_requests')
    .upsert(requestsWithYearMonth, {
      onConflict: 'staff_id,date',
      ignoreDuplicates: false,
    })
    .select()

  if (error) handleSupabaseError(error, { action: 'bulkUpsertShiftRequests', entity: 'シフト希望' })

  revalidatePath('/shifts/create')
  return data
}

export async function deleteShiftRequest(staffId: string, date: string) {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase
    .from('shift_requests')
    .delete()
    .eq('staff_id', staffId)
    .eq('date', date)

  if (error) handleSupabaseError(error, { action: 'deleteShiftRequest', entity: 'シフト希望' })

  revalidatePath('/shifts/create')
}

export async function getShiftRequestsGroupedByYearMonth() {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_shift_requests_by_month')

  if (error) {
    // RPCが存在しない場合は、手動でグループ化
    const { data: allData, error: selectError } = await supabase
      .from('shift_requests')
      .select('date')

    if (selectError) handleSupabaseError(selectError, { action: 'getShiftRequestsGroupedByYearMonth', entity: 'シフト希望' })

    // 年月ごとにグループ化
    const grouped = allData!.reduce((acc, req) => {
      const yearMonth = req.date.substring(0, 7) // YYYY-MM
      if (!acc[yearMonth]) {
        acc[yearMonth] = 0
      }
      acc[yearMonth]++
      return acc
    }, {} as Record<string, number>)

    return Object.entries(grouped)
      .map(([yearMonth, count]) => ({ year_month: yearMonth, count }))
      .sort((a, b) => b.year_month.localeCompare(a.year_month))
  }

  return data
}

// =====================================================
// トークンページ用関数（認証不要・Service Clientを使用）
// =====================================================

/**
 * トークンページ用: スタッフのシフト希望を取得
 * Service Clientを使用してRLSをバイパスする
 */
export async function getShiftRequestsForToken(
  staffId: string,
  yearMonth: string
): Promise<ShiftRequestWithStaff[]> {
  const supabase = createServiceClient()

  const year = parseInt(yearMonth.split('-')[0])
  const month = parseInt(yearMonth.split('-')[1])
  const startDate = `${yearMonth}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${yearMonth}-${String(lastDay).padStart(2, '0')}`

  const { data, error } = await supabase
    .from('shift_requests')
    .select(`
      *,
      staff (
        id,
        employee_number,
        name
      )
    `)
    .eq('staff_id', staffId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (error) handleSupabaseError(error, { action: 'getShiftRequestsForToken', entity: 'シフト希望' })
  return data as ShiftRequestWithStaff[]
}

/**
 * トークンページ用: シフト希望をupsert
 * Service Clientを使用してRLSをバイパスする
 */
export async function upsertShiftRequestsForToken(
  requests: Array<{
    staff_id: string
    date: string
    request_type: '◯' | '休' | '早朝' | '早番' | '遅番' | '夜勤'
    note?: string
  }>
) {
  const supabase = createServiceClient()

  const requestsWithYearMonth = requests.map((req) => ({
    ...req,
    year_month: req.date.substring(0, 7),
  }))

  const { data, error } = await supabase
    .from('shift_requests')
    .upsert(requestsWithYearMonth, {
      onConflict: 'staff_id,date',
      ignoreDuplicates: false,
    })
    .select()

  if (error) handleSupabaseError(error, { action: 'upsertShiftRequestsForToken', entity: 'シフト希望' })

  return data
}
