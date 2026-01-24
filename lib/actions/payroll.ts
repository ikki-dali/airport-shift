'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  calculateMonthlyPayroll,
  calculateAnnualPayroll,
  type MonthlyPayrollSummary,
  type AnnualPayrollSummary,
  type WarningLevel,
  ANNUAL_LIMIT,
  getWarningLevel,
} from '@/lib/payroll/calculator'
import { getShifts } from './shifts'
import { getDutyCodes } from './duty-codes'
import { getStaff } from './staff'
import { handleSupabaseError } from '@/lib/errors/helpers'

/**
 * 給与記録を取得
 */
export async function getPayrollRecords(filters?: {
  staffId?: string
  yearMonth?: string
  year?: number
  status?: 'draft' | 'confirmed'
}) {
  const supabase = await createClient()

  let query = supabase
    .from('payroll_records')
    .select('*')
    .order('year_month', { ascending: false })

  if (filters?.staffId) {
    query = query.eq('staff_id', filters.staffId)
  }

  if (filters?.yearMonth) {
    query = query.eq('year_month', filters.yearMonth)
  }

  if (filters?.year) {
    query = query.like('year_month', `${filters.year}-%`)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query

  if (error) handleSupabaseError(error, { action: 'getPayrollRecords', entity: '給与記録' })
  return data
}

/**
 * 月次給与を計算してDBに保存
 */
export async function calculateAndSaveMonthlyPayroll(
  staffId: string,
  yearMonth: string
): Promise<MonthlyPayrollSummary> {
  const supabase = await createClient()

  // シフトと勤務記号を取得
  const [shifts, dutyCodes] = await Promise.all([
    getShifts(yearMonth),
    getDutyCodes(),
  ])

  // 給与計算
  const payroll = calculateMonthlyPayroll(shifts, dutyCodes, staffId, yearMonth)

  // DBに保存（upsert）
  const { data, error } = await supabase
    .from('payroll_records')
    .upsert(
      {
        staff_id: payroll.staffId,
        year_month: payroll.yearMonth,
        total_hours: payroll.totalHours,
        regular_hours: payroll.regularHours,
        night_hours: payroll.nightHours,
        regular_pay: payroll.regularPay,
        night_pay: payroll.nightPay,
        total_pay: payroll.totalPay,
        shift_count: payroll.shiftCount,
      },
      {
        onConflict: 'staff_id,year_month',
      }
    )
    .select()
    .single()

  if (error) handleSupabaseError(error, { action: 'calculateAndSaveMonthlyPayroll', entity: '給与記録' })

  revalidatePath('/payroll')
  return payroll
}

/**
 * 全スタッフの月次給与を一括計算
 */
export async function calculateAllMonthlyPayroll(yearMonth: string) {
  const supabase = await createClient()

  // 全スタッフ、シフト、勤務記号を取得
  const [staff, shifts, dutyCodes] = await Promise.all([
    getStaff({ isActive: true }),
    getShifts(yearMonth),
    getDutyCodes(),
  ])

  const payrolls: MonthlyPayrollSummary[] = []

  for (const s of staff) {
    const payroll = calculateMonthlyPayroll(shifts, dutyCodes, s.id, yearMonth)
    payrolls.push(payroll)

    // DBに保存
    await supabase.from('payroll_records').upsert(
      {
        staff_id: payroll.staffId,
        year_month: payroll.yearMonth,
        total_hours: payroll.totalHours,
        regular_hours: payroll.regularHours,
        night_hours: payroll.nightHours,
        regular_pay: payroll.regularPay,
        night_pay: payroll.nightPay,
        total_pay: payroll.totalPay,
        shift_count: payroll.shiftCount,
      },
      {
        onConflict: 'staff_id,year_month',
      }
    )
  }

  revalidatePath('/payroll')
  return payrolls
}

/**
 * 年間給与サマリーを取得
 */
export async function getAnnualPayrollSummary(staffId: string, year: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('annual_payroll_summary')
    .select('*')
    .eq('staff_id', staffId)
    .eq('year', year)
    .maybeSingle()

  if (error) handleSupabaseError(error, { action: 'getAnnualPayrollSummary', entity: '年間給与' })
  return data
}

/**
 * 年間給与サマリーを計算してDBに保存
 */
export async function calculateAndSaveAnnualPayroll(
  staffId: string,
  year: number
): Promise<AnnualPayrollSummary> {
  const supabase = await createClient()

  // その年の月次給与記録を取得
  const monthlyRecords = await getPayrollRecords({ staffId, year })

  // 型変換
  const summaries: MonthlyPayrollSummary[] = monthlyRecords.map((r) => ({
    staffId: r.staff_id,
    yearMonth: r.year_month,
    totalHours: Number(r.total_hours),
    regularHours: Number(r.regular_hours),
    nightHours: Number(r.night_hours),
    regularPay: r.regular_pay,
    nightPay: r.night_pay,
    totalPay: r.total_pay,
    shiftCount: r.shift_count,
  }))

  // 年間給与を計算
  const annual = calculateAnnualPayroll(summaries, year, staffId)

  // DBに保存（upsert）
  const { data, error } = await supabase
    .from('annual_payroll_summary')
    .upsert(
      {
        staff_id: annual.staffId,
        year: annual.year,
        total_hours: annual.totalHours,
        total_pay: annual.totalPay,
        limit_amount: annual.limitAmount,
        remaining_amount: annual.remainingAmount,
        warning_level: annual.warningLevel,
      },
      {
        onConflict: 'staff_id,year',
      }
    )
    .select()
    .single()

  if (error) handleSupabaseError(error, { action: 'calculateAndSaveAnnualPayroll', entity: '年間給与' })

  revalidatePath('/payroll')
  return annual
}

/**
 * 全スタッフの年間給与を一括計算
 */
export async function calculateAllAnnualPayroll(year: number) {
  const staff = await getStaff({ isActive: true })

  const annuals: AnnualPayrollSummary[] = []

  for (const s of staff) {
    const annual = await calculateAndSaveAnnualPayroll(s.id, year)
    annuals.push(annual)
  }

  revalidatePath('/payroll')
  return annuals
}

/**
 * スタッフの給与状況を取得（月次+年間）
 */
export async function getStaffPayrollStatus(staffId: string, yearMonth: string) {
  const year = parseInt(yearMonth.split('-')[0], 10)

  const [monthlyRecord, annualSummary] = await Promise.all([
    getPayrollRecords({ staffId, yearMonth }).then((records) => records[0] || null),
    getAnnualPayrollSummary(staffId, year),
  ])

  return {
    monthly: monthlyRecord,
    annual: annualSummary,
  }
}

/**
 * 給与ダッシュボードのデータを取得
 */
export async function getPayrollDashboard(yearMonth: string) {
  const supabase = await createClient()
  const year = parseInt(yearMonth.split('-')[0], 10)

  // 全スタッフの月次給与
  const monthlyRecords = await getPayrollRecords({ yearMonth })

  // 全スタッフの年間サマリー
  const { data: annualSummaries, error: annualError } = await supabase
    .from('annual_payroll_summary')
    .select(`
      *,
      staff:staff_id (
        id,
        employee_number,
        name,
        email,
        roles (
          id,
          name
        )
      )
    `)
    .eq('year', year)

  if (annualError) handleSupabaseError(annualError, { action: 'getPayrollDashboard', entity: '年間給与' })

  // 統計を計算
  const totalMonthlyPay = monthlyRecords.reduce((sum, r) => sum + r.total_pay, 0)
  const exceedingStaffCount = annualSummaries.filter(
    (s) => s.warning_level === 'exceeded'
  ).length
  const warningStaffCount = annualSummaries.filter(
    (s) => s.warning_level === 'warning' || s.warning_level === 'caution'
  ).length

  return {
    totalMonthlyPay,
    exceedingStaffCount,
    warningStaffCount,
    monthlyRecords,
    annualSummaries,
  }
}

/**
 * 給与記録のステータスを更新（draft → confirmed）
 */
export async function confirmPayrollRecord(staffId: string, yearMonth: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payroll_records')
    .update({ status: 'confirmed' })
    .eq('staff_id', staffId)
    .eq('year_month', yearMonth)
    .select()
    .single()

  if (error) handleSupabaseError(error, { action: 'confirmPayrollRecord', entity: '給与記録' })

  revalidatePath('/payroll')
  return data
}

/**
 * 月次給与記録を一括確定
 */
export async function confirmAllPayrollRecords(yearMonth: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payroll_records')
    .update({ status: 'confirmed' })
    .eq('year_month', yearMonth)
    .select()

  if (error) handleSupabaseError(error, { action: 'confirmAllPayrollRecords', entity: '給与記録' })

  revalidatePath('/payroll')
  return data
}
