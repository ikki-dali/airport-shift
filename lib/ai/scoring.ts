import type { Shift, StaffWithRole, DutyCode, ShiftRequest } from './types'

/**
 * スタッフのシフト配置スコアを計算
 * スコアが高いほど適切な配置
 */
export function scoreStaffAssignment(
  staff: StaffWithRole,
  date: string,
  dutyCode: DutyCode,
  shiftRequests: ShiftRequest[],
  existingAssignments: Shift[]
): number {
  let score = 0

  // 1. 希望タイプによるスコア
  const request = shiftRequests.find(
    (r) => r.staff_id === staff.id && r.date === date
  )

  if (request) {
    switch (request.request_type) {
      case '◯': // 勤務希望
        score += 10
        break
      case '休': // 休み希望（強いペナルティ）
        score -= 20
        break
      case '早朝':
      case '早番':
      case '遅番':
      case '夜勤':
        // 希望する勤務記号とマッチするか
        if (matchesDutyCodeType(request.request_type, dutyCode)) {
          score += 5
        } else {
          score -= 3
        }
        break
    }
  }

  // 2. 夜勤明けチェック
  if (isPreviousDayNightShift(staff.id, date, existingAssignments)) {
    score -= 10
  }

  // 3. 連続勤務日数チェック
  const consecutiveDays = getConsecutiveWorkDays(staff.id, date, existingAssignments)
  if (consecutiveDays >= 6) {
    score -= 15 * (consecutiveDays - 5) // 6日目から大きなペナルティ
  } else if (consecutiveDays >= 4) {
    score -= 5 // 4-5日でも少しペナルティ
  }

  // 4. 月間勤務日数の均等化（標準偏差を減らす）
  const monthWorkDays = getMonthWorkDays(staff.id, existingAssignments)
  const avgWorkDays = getAverageMonthWorkDays(existingAssignments)
  if (monthWorkDays < avgWorkDays - 2) {
    score += 3 // 勤務日数が少ないスタッフを優先
  } else if (monthWorkDays > avgWorkDays + 2) {
    score -= 3 // 勤務日数が多いスタッフは避ける
  }

  return score
}

/**
 * 希望タイプが勤務記号タイプとマッチするか
 */
function matchesDutyCodeType(requestType: string, dutyCode: DutyCode): boolean {
  const startHour = parseInt(dutyCode.start_time.split(':')[0])

  switch (requestType) {
    case '早朝':
      return startHour >= 4 && startHour < 7
    case '早番':
      return startHour >= 6 && startHour < 10
    case '遅番':
      return startHour >= 13 && startHour < 17
    case '夜勤':
      return startHour >= 19 || dutyCode.is_overnight
    default:
      return false
  }
}

/**
 * 前日が夜勤かチェック
 */
function isPreviousDayNightShift(
  staffId: string,
  date: string,
  assignments: Shift[]
): boolean {
  const dateObj = new Date(date)
  const prevDate = new Date(dateObj)
  prevDate.setDate(prevDate.getDate() - 1)
  const prevDateStr = prevDate.toISOString().split('T')[0]

  const prevShift = assignments.find(
    (a) => a.staff_id === staffId && a.date === prevDateStr
  )

  if (!prevShift) return false

  // 夜勤の判定は duty_code の情報が必要だが、
  // ここではシンプルに is_overnight フラグで判定
  // 実装時は duty_code 情報も含めて判定
  return false // TODO: duty_code情報を使って判定
}

/**
 * 連続勤務日数を計算
 */
function getConsecutiveWorkDays(
  staffId: string,
  date: string,
  assignments: Shift[]
): number {
  const dateObj = new Date(date)
  let count = 0

  // 前方向にカウント
  for (let i = 1; i <= 14; i++) {
    const checkDate = new Date(dateObj)
    checkDate.setDate(checkDate.getDate() - i)
    const checkDateStr = checkDate.toISOString().split('T')[0]

    const hasShift = assignments.some(
      (a) => a.staff_id === staffId && a.date === checkDateStr
    )

    if (hasShift) {
      count++
    } else {
      break
    }
  }

  return count
}

/**
 * 月間勤務日数を計算
 */
function getMonthWorkDays(staffId: string, assignments: Shift[]): number {
  const staffShifts = assignments.filter((a) => a.staff_id === staffId)
  const uniqueDates = new Set(staffShifts.map((s) => s.date))
  return uniqueDates.size
}

/**
 * 平均月間勤務日数を計算
 */
function getAverageMonthWorkDays(assignments: Shift[]): number {
  const staffWorkDays = new Map<string, Set<string>>()

  assignments.forEach((a) => {
    if (!staffWorkDays.has(a.staff_id)) {
      staffWorkDays.set(a.staff_id, new Set())
    }
    staffWorkDays.get(a.staff_id)!.add(a.date)
  })

  const workDayCounts = Array.from(staffWorkDays.values()).map((dates) => dates.size)
  const sum = workDayCounts.reduce((acc, count) => acc + count, 0)

  return staffWorkDays.size > 0 ? sum / staffWorkDays.size : 0
}

/**
 * 割り当て結果全体のスコアを計算
 */
export function calculateTotalScore(
  assignments: Shift[],
  shiftRequests: ShiftRequest[]
): number {
  let totalScore = 0

  // 希望充足スコア
  assignments.forEach((shift) => {
    const request = shiftRequests.find(
      (r) => r.staff_id === shift.staff_id && r.date === shift.date
    )

    if (request) {
      if (request.request_type === '◯') {
        totalScore += 10
      } else if (request.request_type === '休') {
        totalScore -= 20
      }
    }
  })

  return totalScore
}

/**
 * 統計情報を計算
 */
export interface AssignmentStats {
  totalAssignments: number
  fulfillmentRate: number // 希望充足率
  avgWorkDaysPerStaff: number
  workDaysStdDev: number
  nightShiftAfterCount: number // 夜勤明け配置数
  consecutiveOverLimitCount: number // 連続勤務超過数
}

export function calculateStats(
  assignments: Shift[],
  shiftRequests: ShiftRequest[],
  allStaff: StaffWithRole[]
): AssignmentStats {
  // 希望充足率の計算
  let fulfilledRequests = 0
  const relevantRequests = shiftRequests.filter(
    (r) => r.request_type === '◯' || r.request_type === '休'
  )

  relevantRequests.forEach((request) => {
    const hasShift = assignments.some(
      (a) => a.staff_id === request.staff_id && a.date === request.date
    )

    if (request.request_type === '◯' && hasShift) {
      fulfilledRequests++
    } else if (request.request_type === '休' && !hasShift) {
      fulfilledRequests++
    }
  })

  const fulfillmentRate =
    relevantRequests.length > 0 ? (fulfilledRequests / relevantRequests.length) * 100 : 0

  // 勤務日数の統計
  const staffWorkDays = new Map<string, Set<string>>()
  allStaff.forEach((staff) => staffWorkDays.set(staff.id, new Set()))

  assignments.forEach((a) => {
    staffWorkDays.get(a.staff_id)?.add(a.date)
  })

  const workDayCounts = Array.from(staffWorkDays.values()).map((dates) => dates.size)
  const avgWorkDays =
    workDayCounts.reduce((acc, count) => acc + count, 0) / workDayCounts.length

  const variance =
    workDayCounts.reduce((acc, count) => acc + Math.pow(count - avgWorkDays, 2), 0) /
    workDayCounts.length
  const stdDev = Math.sqrt(variance)

  return {
    totalAssignments: assignments.length,
    fulfillmentRate: Math.round(fulfillmentRate * 10) / 10,
    avgWorkDaysPerStaff: Math.round(avgWorkDays * 10) / 10,
    workDaysStdDev: Math.round(stdDev * 10) / 10,
    nightShiftAfterCount: 0, // TODO: 実装
    consecutiveOverLimitCount: 0, // TODO: 実装
  }
}
