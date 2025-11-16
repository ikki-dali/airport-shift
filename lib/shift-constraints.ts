import type { Shift } from './actions/shifts'
import type { Staff } from './actions/staff'
import type { Location } from './actions/locations'

export interface ConstraintViolation {
  type: 'error' | 'warning'
  message: string
  locationId?: string
  date?: string
  staffId?: string
}

/**
 * スタッフの重複チェック
 * 同じスタッフが同じ日に複数のシフトを持っていないか
 */
export function checkDuplicateStaffShift(
  shifts: Shift[],
  newShift: { staffId: string; date: string }
): ConstraintViolation | null {
  const duplicate = shifts.find(
    (s) => s.staff_id === newShift.staffId && s.date === newShift.date
  )

  if (duplicate) {
    return {
      type: 'error',
      message: `このスタッフは既に${newShift.date}にシフトが登録されています`,
      staffId: newShift.staffId,
      date: newShift.date,
    }
  }

  return null
}

/**
 * 配置箇所の必要人数チェック
 * 特定の日付・配置箇所で必要人数を満たしているか
 */
export function checkLocationStaffCount(
  shifts: Shift[],
  locationId: string,
  date: string,
  requiredCount: number
): ConstraintViolation | null {
  const assignedCount = shifts.filter(
    (s) => s.location_id === locationId && s.date === date
  ).length

  if (assignedCount < requiredCount) {
    return {
      type: 'warning',
      message: `必要人数: ${requiredCount}名、現在: ${assignedCount}名`,
      locationId,
      date,
    }
  }

  return null
}

/**
 * 責任者の配置チェック
 * 必要な責任者数を満たしているか
 */
export function checkResponsibleStaff(
  shifts: Shift[],
  staff: Staff[],
  locationId: string,
  date: string,
  requiredResponsibleCount: number
): ConstraintViolation | null {
  const assignedStaff = shifts
    .filter((s) => s.location_id === locationId && s.date === date)
    .map((s) => staff.find((st) => st.id === s.staff_id))
    .filter((st) => st !== undefined) as Staff[]

  // 責任者資格を持つスタッフの役職IDを取得（後でDBから取得）
  const responsibleStaff = assignedStaff.filter((st) => {
    // TODO: 役職テーブルから is_responsible フラグを確認
    return false // 仮実装
  })

  if (responsibleStaff.length < requiredResponsibleCount) {
    return {
      type: 'warning',
      message: `責任者が不足しています（必要: ${requiredResponsibleCount}名、現在: ${responsibleStaff.length}名）`,
      locationId,
      date,
    }
  }

  return null
}

/**
 * 必要なタグ（スキル・資格）のチェック
 */
export function checkRequiredTags(
  shifts: Shift[],
  staff: Staff[],
  locationId: string,
  date: string,
  requiredTags: string[]
): ConstraintViolation | null {
  if (requiredTags.length === 0) return null

  const assignedStaff = shifts
    .filter((s) => s.location_id === locationId && s.date === date)
    .map((s) => staff.find((st) => st.id === s.staff_id))
    .filter((st) => st !== undefined) as Staff[]

  const missingTags = requiredTags.filter((requiredTag) => {
    return !assignedStaff.some(
      (st) => st.tag_ids && st.tag_ids.includes(requiredTag)
    )
  })

  if (missingTags.length > 0) {
    return {
      type: 'warning',
      message: `必要な資格を持つスタッフが不足しています: ${missingTags.join(', ')}`,
      locationId,
      date,
    }
  }

  return null
}

/**
 * すべての制約をチェック
 */
export function checkAllConstraints(
  shifts: Shift[],
  staff: Staff[],
  locations: Location[]
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = []

  // TODO: 配置箇所ごとの要件を確認
  // location_requirements テーブルから取得した情報を元にチェック

  return violations
}

/**
 * 新しいシフトを追加する際の制約チェック
 */
export function validateNewShift(
  shifts: Shift[],
  newShift: { staffId: string; locationId: string; date: string }
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = []

  // 重複チェック
  const duplicateViolation = checkDuplicateStaffShift(shifts, {
    staffId: newShift.staffId,
    date: newShift.date,
  })
  if (duplicateViolation) {
    violations.push(duplicateViolation)
  }

  return violations
}
