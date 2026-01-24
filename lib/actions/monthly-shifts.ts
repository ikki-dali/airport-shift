'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { handleSupabaseError } from '@/lib/errors/helpers'

type Staff = Database['public']['Tables']['staff']['Row']
type Shift = Database['public']['Tables']['shifts']['Row']
type Location = Database['public']['Tables']['locations']['Row']
type DutyCode = Database['public']['Tables']['duty_codes']['Row']

export type ShiftWithDetails = Shift & {
  locations: Location | null
  duty_codes: DutyCode | null
  staff: {
    id: string
    employee_number: string
    name: string
  } | null
}

export type StaffWithShifts = Staff & {
  shifts: ShiftWithDetails[]
}

/**
 * 指定された年月のシフトデータをスタッフごとに取得
 */
export async function getMonthlyShiftsByStaff(yearMonth: string) {
  const supabase = await createClient()

  // yearMonth: "2025-11" 形式
  const [year, month] = yearMonth.split('-')
  const startDate = `${year}-${month}-01`
  const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]

  // スタッフ一覧を取得
  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('*')
    .eq('is_active', true)
    .order('employee_number')

  if (staffError) handleSupabaseError(staffError, { action: 'getMonthlyShiftsByStaff', entity: 'スタッフ' })

  // 指定月のシフトを取得
  const { data: shifts, error: shiftsError } = await supabase
    .from('shifts')
    .select(`
      *,
      locations (
        id,
        location_name,
        code
      ),
      duty_codes (
        id,
        code,
        start_time,
        end_time,
        category
      ),
      staff (
        id,
        employee_number,
        name
      )
    `)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')

  if (shiftsError) handleSupabaseError(shiftsError, { action: 'getMonthlyShiftsByStaff', entity: 'シフト' })

  // スタッフごとにシフトをグループ化
  const staffWithShifts: StaffWithShifts[] = staff!.map((s) => ({
    ...s,
    shifts: (shifts as ShiftWithDetails[]).filter((shift) => shift.staff_id === s.id),
  }))

  return staffWithShifts
}

/**
 * 指定された年月の日数を取得
 */
export function getDaysInMonth(yearMonth: string): number {
  const [year, month] = yearMonth.split('-')
  return new Date(parseInt(year), parseInt(month), 0).getDate()
}

/**
 * 指定された年月の各日の曜日を取得
 */
export function getDayOfWeekForMonth(yearMonth: string): string[] {
  const [year, month] = yearMonth.split('-')
  const days = getDaysInMonth(yearMonth)
  const dayOfWeeks: string[] = []
  const weekDayNames = ['日', '月', '火', '水', '木', '金', '土']

  for (let day = 1; day <= days; day++) {
    const date = new Date(parseInt(year), parseInt(month) - 1, day)
    dayOfWeeks.push(weekDayNames[date.getDay()])
  }

  return dayOfWeeks
}
