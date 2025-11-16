'use server'

import { createClient } from '@/lib/supabase/server'
import type { Shift } from '@/lib/actions/shifts'

export interface ConstraintViolation {
  type: 'error' | 'warning'
  severity: 'error' | 'warning'
  message: string
  locationId?: string
  locationName?: string
  dutyCodeId?: string
  dutyCodeName?: string
  staffId?: string
  staffName?: string
  date?: string
  details?: string
}

interface ValidationContext {
  shifts: Shift[]
  date: string
  locationId: string
  dutyCodeId: string
}

/**
 * 配属箇所要件を取得
 * 優先順位: 特定日 > 曜日 > デフォルト
 */
async function getLocationRequirement(
  locationId: string,
  dutyCodeId: string,
  date: string
) {
  const supabase = await createClient()
  const dayOfWeek = new Date(date).getDay()

  // 特定日の要件を検索
  let { data: requirement } = await supabase
    .from('location_requirements')
    .select('*')
    .eq('location_id', locationId)
    .eq('duty_code_id', dutyCodeId)
    .eq('specific_date', date)
    .single()

  if (requirement) return requirement

  // 曜日パターンの要件を検索
  const { data: dayRequirement } = await supabase
    .from('location_requirements')
    .select('*')
    .eq('location_id', locationId)
    .eq('duty_code_id', dutyCodeId)
    .eq('day_of_week', dayOfWeek)
    .is('specific_date', null)
    .single()

  if (dayRequirement) return dayRequirement

  // デフォルト要件を検索
  const { data: defaultRequirement } = await supabase
    .from('location_requirements')
    .select('*')
    .eq('location_id', locationId)
    .eq('duty_code_id', dutyCodeId)
    .is('day_of_week', null)
    .is('specific_date', null)
    .single()

  return defaultRequirement
}

/**
 * 必要人数チェック
 */
export async function checkStaffCount(
  context: ValidationContext
): Promise<ConstraintViolation[]> {
  const violations: ConstraintViolation[] = []

  const requirement = await getLocationRequirement(
    context.locationId,
    context.dutyCodeId,
    context.date
  )

  if (!requirement) {
    // 要件が設定されていない場合は警告
    violations.push({
      type: 'warning',
      severity: 'warning',
      message: 'この配属箇所・勤務記号の要件が設定されていません',
      locationId: context.locationId,
      date: context.date,
    })
    return violations
  }

  // 割り当て済みスタッフ数を取得
  const assignedCount = context.shifts.filter(
    (s) =>
      s.location_id === context.locationId &&
      s.duty_code_id === context.dutyCodeId &&
      s.date === context.date
  ).length

  // 不足チェック
  if (assignedCount < requirement.required_staff_count) {
    violations.push({
      type: 'error',
      severity: 'error',
      message: `必要人数が不足しています（${assignedCount}/${requirement.required_staff_count}名）`,
      locationId: context.locationId,
      date: context.date,
    })
  }

  // 超過チェック
  if (assignedCount > requirement.required_staff_count) {
    violations.push({
      type: 'warning',
      severity: 'warning',
      message: `必要人数を超過しています（${assignedCount}/${requirement.required_staff_count}名）`,
      locationId: context.locationId,
      date: context.date,
    })
  }

  return violations
}

/**
 * 責任者配置チェック
 */
export async function checkResponsibleStaff(
  context: ValidationContext
): Promise<ConstraintViolation[]> {
  const violations: ConstraintViolation[] = []

  const requirement = await getLocationRequirement(
    context.locationId,
    context.dutyCodeId,
    context.date
  )

  if (!requirement || requirement.required_responsible_count === 0) {
    return violations
  }

  const supabase = await createClient()

  // 割り当て済みスタッフを取得（役職情報含む）
  const assignedShifts = context.shifts.filter(
    (s) =>
      s.location_id === context.locationId &&
      s.duty_code_id === context.dutyCodeId &&
      s.date === context.date
  )

  const staffIds = assignedShifts.map((s) => s.staff_id)

  if (staffIds.length === 0) {
    violations.push({
      type: 'error',
      severity: 'error',
      message: `責任者が不足しています（0/${requirement.required_responsible_count}名）`,
      locationId: context.locationId,
      date: context.date,
    })
    return violations
  }

  // スタッフの役職情報を取得
  const { data: staff } = await supabase
    .from('staff')
    .select(
      `
      id,
      roles (
        is_responsible
      )
    `
    )
    .in('id', staffIds)

  const responsibleCount =
    staff?.filter((s: any) => s.roles?.is_responsible).length || 0

  if (responsibleCount < requirement.required_responsible_count) {
    violations.push({
      type: 'error',
      severity: 'error',
      message: `責任者が不足しています（${responsibleCount}/${requirement.required_responsible_count}名）`,
      locationId: context.locationId,
      date: context.date,
    })
  }

  return violations
}

/**
 * 必要タグチェック
 */
export async function checkRequiredTags(
  context: ValidationContext
): Promise<ConstraintViolation[]> {
  const violations: ConstraintViolation[] = []

  const requirement = await getLocationRequirement(
    context.locationId,
    context.dutyCodeId,
    context.date
  )

  if (
    !requirement ||
    !requirement.required_tags ||
    requirement.required_tags.length === 0
  ) {
    return violations
  }

  const supabase = await createClient()

  // 割り当て済みスタッフを取得
  const assignedShifts = context.shifts.filter(
    (s) =>
      s.location_id === context.locationId &&
      s.duty_code_id === context.dutyCodeId &&
      s.date === context.date
  )

  const staffIds = assignedShifts.map((s) => s.staff_id)

  if (staffIds.length === 0) {
    violations.push({
      type: 'error',
      severity: 'error',
      message: `必要なタグを持つスタッフが配置されていません: ${requirement.required_tags.join(', ')}`,
      locationId: context.locationId,
      date: context.date,
    })
    return violations
  }

  // スタッフのタグ情報を取得
  const { data: staff } = await supabase
    .from('staff')
    .select('id, tags')
    .in('id', staffIds)

  // 各必要タグについて、少なくとも1人が持っているかチェック
  const missingTags = requirement.required_tags.filter((requiredTag) => {
    return !staff?.some((s: any) => s.tags && s.tags.includes(requiredTag))
  })

  if (missingTags.length > 0) {
    violations.push({
      type: 'error',
      severity: 'error',
      message: `必要なタグを持つスタッフが配置されていません: ${missingTags.join(', ')}`,
      locationId: context.locationId,
      date: context.date,
    })
  }

  return violations
}

/**
 * 重複チェック
 */
export async function checkDuplicateStaff(
  shifts: Shift[],
  staffId: string,
  date: string
): Promise<ConstraintViolation | null> {
  const duplicate = shifts.find((s) => s.staff_id === staffId && s.date === date)

  if (duplicate) {
    return {
      type: 'error',
      severity: 'error',
      message: `このスタッフは既に${date}にシフトが登録されています`,
      staffId,
      date,
    }
  }

  return null
}

/**
 * 夜勤明けルールチェック
 * 夜勤の翌日は勤務に制限がある
 */
export async function checkNightShiftRule(
  shifts: Shift[],
  staffId: string,
  date: string
): Promise<ConstraintViolation | null> {
  // 前日のシフトを取得
  const previousDate = new Date(date)
  previousDate.setDate(previousDate.getDate() - 1)
  const prevDateStr = previousDate.toISOString().split('T')[0]

  const previousShift = shifts.find(
    (s) => s.staff_id === staffId && s.date === prevDateStr
  )

  if (!previousShift) return null

  // 前日の勤務記号を取得
  const supabase = await createClient()
  const { data: dutyCode } = await supabase
    .from('duty_codes')
    .select('id, code, start_time, end_time')
    .eq('id', previousShift.duty_code_id)
    .single()

  if (!dutyCode) return null

  // 夜勤判定（開始時刻が19:00以降）
  const startHour = parseInt(dutyCode.start_time.split(':')[0])
  if (startHour >= 19) {
    return {
      type: 'warning',
      severity: 'warning',
      message: `前日が夜勤のため、勤務に制限があります（前日: ${dutyCode.code}）`,
      staffId,
      date,
      details: `夜勤明けのため、休息が推奨されます`,
    }
  }

  return null
}

/**
 * 連続勤務制限チェック
 * 連続勤務日数が上限を超えていないかチェック
 */
export async function checkConsecutiveWorkLimit(
  shifts: Shift[],
  staffId: string,
  date: string,
  maxConsecutiveDays: number = 6
): Promise<ConstraintViolation | null> {
  // 対象日を含む連続勤務日数をカウント
  let consecutiveDays = 1 // 対象日を含む

  // 過去方向にカウント
  let checkDate = new Date(date)
  while (true) {
    checkDate.setDate(checkDate.getDate() - 1)
    const checkDateStr = checkDate.toISOString().split('T')[0]

    const hasShift = shifts.some(
      (s) => s.staff_id === staffId && s.date === checkDateStr
    )

    if (hasShift) {
      consecutiveDays++
    } else {
      break
    }

    // 無限ループ防止（最大30日まで）
    if (consecutiveDays > 30) break
  }

  // 未来方向にカウント
  checkDate = new Date(date)
  while (true) {
    checkDate.setDate(checkDate.getDate() + 1)
    const checkDateStr = checkDate.toISOString().split('T')[0]

    const hasShift = shifts.some(
      (s) => s.staff_id === staffId && s.date === checkDateStr
    )

    if (hasShift) {
      consecutiveDays++
    } else {
      break
    }

    // 無限ループ防止（最大30日まで）
    if (consecutiveDays > 30) break
  }

  if (consecutiveDays > maxConsecutiveDays) {
    return {
      type: 'warning',
      severity: 'warning',
      message: `連続勤務日数が上限を超えています（${consecutiveDays}日 / 上限${maxConsecutiveDays}日）`,
      staffId,
      date,
      details: `休日の取得が推奨されます`,
    }
  }

  return null
}

/**
 * 全制約チェック
 */
export async function validateShifts(
  shifts: Shift[],
  locationId: string,
  dutyCodeId: string,
  date: string
): Promise<ConstraintViolation[]> {
  const context: ValidationContext = {
    shifts,
    date,
    locationId,
    dutyCodeId,
  }

  const violations: ConstraintViolation[] = []

  // 必要人数チェック
  const staffCountViolations = await checkStaffCount(context)
  violations.push(...staffCountViolations)

  // 責任者チェック
  const responsibleViolations = await checkResponsibleStaff(context)
  violations.push(...responsibleViolations)

  // 必要タグチェック
  const tagsViolations = await checkRequiredTags(context)
  violations.push(...tagsViolations)

  return violations
}

/**
 * 新しいシフトを追加する際の制約チェック
 */
export async function validateNewShift(
  shifts: Shift[],
  newShift: { staffId: string; locationId: string; dutyCodeId: string; date: string }
): Promise<ConstraintViolation[]> {
  const violations: ConstraintViolation[] = []

  // 重複チェック
  const duplicateViolation = await checkDuplicateStaff(
    shifts,
    newShift.staffId,
    newShift.date
  )
  if (duplicateViolation) {
    violations.push(duplicateViolation)
  }

  // 夜勤明けルールチェック
  const nightShiftViolation = await checkNightShiftRule(
    shifts,
    newShift.staffId,
    newShift.date
  )
  if (nightShiftViolation) {
    violations.push(nightShiftViolation)
  }

  // 連続勤務制限チェック
  const consecutiveWorkViolation = await checkConsecutiveWorkLimit(
    shifts,
    newShift.staffId,
    newShift.date
  )
  if (consecutiveWorkViolation) {
    violations.push(consecutiveWorkViolation)
  }

  return violations
}
