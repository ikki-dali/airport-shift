/**
 * 給与計算ロジック
 * - 通常時給: 1800円
 * - 夜勤時給: 2250円（22:00～翌5:00）
 */

import type { DutyCode } from '@/lib/actions/duty-codes'
import type { Shift } from '@/lib/actions/shifts'

// 定数
export const HOURLY_RATE = 1800 // 通常時給
export const NIGHT_RATE = 2250 // 夜勤時給
export const NIGHT_START_HOUR = 22 // 夜勤開始時刻（22:00）
export const NIGHT_END_HOUR = 5 // 夜勤終了時刻（翌5:00）

// 給与の壁（プリセット）
export const PAYROLL_LIMITS = {
  TAX_DEPENDENT_103: 1030000, // 103万円の壁（所得税の扶養控除）
  INSURANCE_106: 1060000, // 106万円の壁（社会保険加入・大企業）
  INSURANCE_130: 1300000, // 130万円の壁（社会保険加入・一般）
  SPOUSE_150: 1500000, // 150万円の壁（配偶者特別控除）
} as const

export const ANNUAL_LIMIT = PAYROLL_LIMITS.TAX_DEPENDENT_103 // デフォルトは103万円

export type LimitType = 'tax_dependent_103' | 'insurance_106' | 'insurance_130' | 'spouse_150' | 'custom'

// 給与制限タイプのラベル
export const LIMIT_TYPE_LABELS: Record<LimitType, string> = {
  tax_dependent_103: '103万円（扶養控除）',
  insurance_106: '106万円（社保・大企業）',
  insurance_130: '130万円（社保・一般）',
  spouse_150: '150万円（配偶者控除）',
  custom: 'カスタム',
}

// 給与制限タイプから金額を取得
export function getLimitAmount(limitType: LimitType, customAmount?: number): number {
  switch (limitType) {
    case 'tax_dependent_103':
      return PAYROLL_LIMITS.TAX_DEPENDENT_103
    case 'insurance_106':
      return PAYROLL_LIMITS.INSURANCE_106
    case 'insurance_130':
      return PAYROLL_LIMITS.INSURANCE_130
    case 'spouse_150':
      return PAYROLL_LIMITS.SPOUSE_150
    case 'custom':
      return customAmount || PAYROLL_LIMITS.TAX_DEPENDENT_103
    default:
      return PAYROLL_LIMITS.TAX_DEPENDENT_103
  }
}

export type WarningLevel = 'safe' | 'caution' | 'warning' | 'exceeded'

export interface TimeRange {
  start: string // 'HH:mm'
  end: string // 'HH:mm'
}

export interface NightHoursCalculation {
  regularHours: number // 通常勤務時間
  nightHours: number // 夜勤時間
  totalHours: number // 総勤務時間
}

export interface PayCalculation {
  regularHours: number
  nightHours: number
  totalHours: number
  regularPay: number // 通常時給分
  nightPay: number // 夜勤時給分
  totalPay: number // 総給与
}

export interface MonthlyPayrollSummary {
  staffId: string
  yearMonth: string
  totalHours: number
  regularHours: number
  nightHours: number
  regularPay: number
  nightPay: number
  totalPay: number
  shiftCount: number
}

export interface AnnualPayrollSummary {
  staffId: string
  year: number
  totalHours: number
  totalPay: number
  limitAmount: number
  remainingAmount: number
  warningLevel: WarningLevel
  monthlyBreakdown: Array<{
    month: number
    totalPay: number
    totalHours: number
  }>
}

/**
 * 時刻文字列をパース（HH:mm → 時間数）
 */
function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours + minutes / 60
}

/**
 * 夜勤時間を計算（22:00～翌5:00）
 */
export function calculateNightHours(timeRange: TimeRange): NightHoursCalculation {
  const startHour = parseTime(timeRange.start)
  const endHour = parseTime(timeRange.end)

  // 終了時刻が開始時刻より小さい場合は翌日扱い
  let adjustedEnd = endHour
  if (endHour <= startHour) {
    adjustedEnd += 24
  }

  const totalHours = adjustedEnd - startHour
  let nightHours = 0

  // 夜勤時間の計算
  // ケース1: 22:00以降に開始
  if (startHour >= NIGHT_START_HOUR) {
    // 翌日05:00（= 24 + NIGHT_END_HOUR = 29）までが夜勤時間帯
    const nightEnd = Math.min(adjustedEnd, 24 + NIGHT_END_HOUR)
    nightHours = Math.max(0, nightEnd - startHour)
  }
  // ケース2: 翌5:00より前に終了（深夜帯から開始）
  else if (adjustedEnd <= NIGHT_END_HOUR) {
    nightHours = totalHours
  }
  // ケース3: 22:00をまたぐ勤務
  else if (startHour < NIGHT_START_HOUR && adjustedEnd > NIGHT_START_HOUR) {
    // 翌日05:00（= 24 + NIGHT_END_HOUR = 29）までが夜勤時間帯
    const nightEnd = Math.min(adjustedEnd, 24 + NIGHT_END_HOUR)
    nightHours = nightEnd - NIGHT_START_HOUR
  }
  // ケース4: 翌5:00をまたぐ勤務（深夜帯から開始）
  else if (startHour < NIGHT_END_HOUR && adjustedEnd > NIGHT_END_HOUR) {
    nightHours = NIGHT_END_HOUR - startHour
  }

  const regularHours = totalHours - nightHours

  return {
    regularHours: Math.max(0, regularHours),
    nightHours: Math.max(0, nightHours),
    totalHours,
  }
}

/**
 * 単一シフトの給与を計算
 */
export function calculateShiftPay(dutyCode: DutyCode): PayCalculation {
  if (!dutyCode.start_time || !dutyCode.end_time) {
    return {
      regularHours: 0,
      nightHours: 0,
      totalHours: 0,
      regularPay: 0,
      nightPay: 0,
      totalPay: 0,
    }
  }

  const { regularHours, nightHours, totalHours } = calculateNightHours({
    start: dutyCode.start_time,
    end: dutyCode.end_time,
  })

  const regularPay = Math.floor(regularHours * HOURLY_RATE)
  const nightPay = Math.floor(nightHours * NIGHT_RATE)
  const totalPay = regularPay + nightPay

  return {
    regularHours,
    nightHours,
    totalHours,
    regularPay,
    nightPay,
    totalPay,
  }
}

/**
 * 月次給与を集計
 */
export function calculateMonthlyPayroll(
  shifts: Shift[],
  dutyCodes: DutyCode[],
  staffId: string,
  yearMonth: string
): MonthlyPayrollSummary {
  const dutyCodeMap = new Map(dutyCodes.map((dc) => [dc.id, dc]))

  // その月のスタッフのシフトをフィルター
  const staffShifts = shifts.filter(
    (s) => s.staff_id === staffId && s.date.startsWith(yearMonth)
  )

  let totalHours = 0
  let regularHours = 0
  let nightHours = 0
  let regularPay = 0
  let nightPay = 0

  for (const shift of staffShifts) {
    const dutyCode = dutyCodeMap.get(shift.duty_code_id)
    if (!dutyCode) continue

    const pay = calculateShiftPay(dutyCode)
    totalHours += pay.totalHours
    regularHours += pay.regularHours
    nightHours += pay.nightHours
    regularPay += pay.regularPay
    nightPay += pay.nightPay
  }

  const totalPay = regularPay + nightPay

  return {
    staffId,
    yearMonth,
    totalHours,
    regularHours,
    nightHours,
    regularPay,
    nightPay,
    totalPay,
    shiftCount: staffShifts.length,
  }
}

/**
 * 年間給与を集計
 */
export function calculateAnnualPayroll(
  monthlyRecords: MonthlyPayrollSummary[],
  year: number,
  staffId: string
): AnnualPayrollSummary {
  const yearRecords = monthlyRecords.filter(
    (r) => r.staffId === staffId && r.yearMonth.startsWith(year.toString())
  )

  let totalHours = 0
  let totalPay = 0
  const monthlyBreakdown: Array<{ month: number; totalPay: number; totalHours: number }> = []

  for (const record of yearRecords) {
    totalHours += record.totalHours
    totalPay += record.totalPay

    const month = parseInt(record.yearMonth.split('-')[1], 10)
    monthlyBreakdown.push({
      month,
      totalPay: record.totalPay,
      totalHours: record.totalHours,
    })
  }

  // 月順にソート
  monthlyBreakdown.sort((a, b) => a.month - b.month)

  const remainingAmount = ANNUAL_LIMIT - totalPay
  const warningLevel = getWarningLevel(totalPay)

  return {
    staffId,
    year,
    totalHours,
    totalPay,
    limitAmount: ANNUAL_LIMIT,
    remainingAmount,
    warningLevel,
    monthlyBreakdown,
  }
}

/**
 * 警告レベルを判定（カスタム上限額対応）
 */
export function getWarningLevel(
  totalPay: number,
  limitAmount: number = ANNUAL_LIMIT,
  warningPercent: number = 85,
  cautionPercent: number = 75
): WarningLevel {
  const warningThreshold = limitAmount * (warningPercent / 100)
  const cautionThreshold = limitAmount * (cautionPercent / 100)

  if (totalPay >= limitAmount) {
    return 'exceeded' // 上限超過
  } else if (totalPay >= warningThreshold) {
    return 'warning' // 警告レベル（デフォルト85%以上）
  } else if (totalPay >= cautionThreshold) {
    return 'caution' // 注意レベル（デフォルト75%以上）
  } else {
    return 'safe' // 安全
  }
}

/**
 * 警告レベルに応じた色を取得
 */
export function getWarningLevelColor(level: WarningLevel): string {
  switch (level) {
    case 'safe':
      return 'text-green-600 bg-green-50 border-green-300'
    case 'caution':
      return 'text-yellow-600 bg-yellow-50 border-yellow-300'
    case 'warning':
      return 'text-orange-600 bg-orange-50 border-orange-300'
    case 'exceeded':
      return 'text-red-600 bg-red-50 border-red-300'
  }
}

/**
 * 警告レベルのラベルを取得
 */
export function getWarningLevelLabel(level: WarningLevel): string {
  switch (level) {
    case 'safe':
      return '✅ 安全'
    case 'caution':
      return '⚠️ 注意'
    case 'warning':
      return '🟠 警告'
    case 'exceeded':
      return '🔴 超過'
  }
}

/**
 * 月次推奨上限を計算
 * 残り月数から逆算して、上限を超えないための月次上限を算出
 */
export function calculateMonthlyLimit(
  currentTotalPay: number,
  currentMonth: number,
  limitAmount: number = ANNUAL_LIMIT
): number {
  const remainingAmount = limitAmount - currentTotalPay
  const remainingMonths = 12 - currentMonth + 1

  if (remainingMonths <= 0) {
    return 0
  }

  return Math.floor(remainingAmount / remainingMonths)
}

/**
 * 給与を円表記にフォーマット
 */
export function formatPay(pay: number): string {
  return `${(pay / 10000).toFixed(1)}万円`
}

/**
 * 時間をフォーマット
 */
export function formatHours(hours: number): string {
  return `${hours.toFixed(1)}時間`
}
