import type { StaffWithRole, DutyCode, Shift, ShiftRequest } from './types'

/**
 * 制約ソルバー - ハード制約を満たすスタッフの選択
 */

export interface PositionRequirement {
  date: string
  location_id: string
  duty_code_id: string
  dutyCode: DutyCode
  required_count: number
  requires_responsible: boolean
  required_tags: string[]
}

export interface ConstraintValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * スタッフが特定の位置に割り当て可能かチェック（ハード制約）
 */
export function canAssignStaff(
  staff: StaffWithRole,
  requirement: PositionRequirement,
  existingAssignments: Shift[]
): ConstraintValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 1. 責任者要件チェック
  if (requirement.requires_responsible && !staff.roles?.is_responsible) {
    errors.push(`${staff.name}は責任者ではありません`)
  }

  // 2. タグ要件チェック（スタッフが必要なタグをすべて持っているか）
  if (requirement.required_tags.length > 0) {
    const staffTags = staff.tags || []
    const missingTags = requirement.required_tags.filter(
      (tag) => !staffTags.includes(tag)
    )
    if (missingTags.length > 0) {
      errors.push(`${staff.name}は必要なタグ(${missingTags.join(', ')})を持っていません`)
    }
  }

  // 3. 同日重複チェック（同じ日に既に別の場所に割り当てられていないか）
  const sameDayAssignment = existingAssignments.find(
    (a) => a.staff_id === staff.id && a.date === requirement.date
  )
  if (sameDayAssignment) {
    errors.push(`${staff.name}は既に${requirement.date}に別の場所に割り当てられています`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * 位置の要件が満たされているかチェック
 */
export function validatePositionFulfillment(
  requirement: PositionRequirement,
  assignments: Shift[]
): ConstraintValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // その位置への割り当てを抽出
  const positionAssignments = assignments.filter(
    (a) =>
      a.date === requirement.date &&
      a.location_id === requirement.location_id &&
      a.duty_code_id === requirement.duty_code_id
  )

  // 1. 必要人数チェック
  if (positionAssignments.length < requirement.required_count) {
    errors.push(
      `必要人数${requirement.required_count}人に対して${positionAssignments.length}人しか割り当てられていません`
    )
  }

  // 2. 責任者要件チェック（割り当てられたスタッフの中に責任者がいるか）
  if (requirement.requires_responsible) {
    const hasResponsible = positionAssignments.some((a) => {
      // ここでスタッフ情報を取得する必要があるが、簡略化のためフラグで判定
      return a.is_responsible === true
    })

    if (!hasResponsible) {
      errors.push('責任者が割り当てられていません')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * 位置に割り当て可能なスタッフをスコア順にソート
 */
export function getCandidateStaff(
  requirement: PositionRequirement,
  allStaff: StaffWithRole[],
  existingAssignments: Shift[],
  shiftRequests: ShiftRequest[],
  scoringFunction: (staff: StaffWithRole) => number
): Array<{ staff: StaffWithRole; score: number; validation: ConstraintValidationResult }> {
  const candidates = allStaff.map((staff) => {
    const validation = canAssignStaff(staff, requirement, existingAssignments)
    const score = validation.isValid ? scoringFunction(staff) : -Infinity

    return {
      staff,
      score,
      validation,
    }
  })

  // スコアが高い順にソート（制約違反は最後）
  return candidates.sort((a, b) => b.score - a.score)
}

/**
 * 位置に最適なスタッフを選択（ハード制約を満たす中でスコアが最高）
 */
export function selectOptimalStaff(
  requirement: PositionRequirement,
  allStaff: StaffWithRole[],
  existingAssignments: Shift[],
  shiftRequests: ShiftRequest[],
  scoringFunction: (staff: StaffWithRole) => number
): StaffWithRole | null {
  const candidates = getCandidateStaff(
    requirement,
    allStaff,
    existingAssignments,
    shiftRequests,
    scoringFunction
  )

  // 制約を満たす最初の候補（最高スコア）を返す
  const validCandidate = candidates.find((c) => c.validation.isValid)
  return validCandidate?.staff || null
}

/**
 * 複数のスタッフを選択（required_count分）
 */
export function selectOptimalStaffMultiple(
  requirement: PositionRequirement,
  allStaff: StaffWithRole[],
  existingAssignments: Shift[],
  shiftRequests: ShiftRequest[],
  scoringFunction: (staff: StaffWithRole) => number
): {
  selectedStaff: StaffWithRole[]
  validation: ConstraintValidationResult
} {
  const selected: StaffWithRole[] = []
  const tempAssignments = [...existingAssignments]
  const errors: string[] = []
  const warnings: string[] = []

  // 責任者が必要な場合、まず責任者を優先的に選択
  if (requirement.requires_responsible) {
    const responsibleStaff = allStaff.filter((s) => s.roles?.is_responsible)
    const responsibleCandidate = selectOptimalStaff(
      requirement,
      responsibleStaff,
      tempAssignments,
      shiftRequests,
      scoringFunction
    )

    if (responsibleCandidate) {
      selected.push(responsibleCandidate)
      // 仮割り当てを追加（次の選択で重複を防ぐ）
      tempAssignments.push({
        id: `temp-${Date.now()}-${responsibleCandidate.id}`,
        date: requirement.date,
        location_id: requirement.location_id,
        duty_code_id: requirement.duty_code_id,
        staff_id: responsibleCandidate.id,
        is_responsible: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } else {
      errors.push('責任者の要件を満たすスタッフが見つかりません')
    }
  }

  // 残りの必要人数分を選択
  while (selected.length < requirement.required_count) {
    const nextStaff = selectOptimalStaff(
      requirement,
      allStaff,
      tempAssignments,
      shiftRequests,
      scoringFunction
    )

    if (!nextStaff) {
      errors.push(
        `必要人数${requirement.required_count}人に対して${selected.length}人しか選択できませんでした`
      )
      break
    }

    selected.push(nextStaff)
    // 仮割り当てを追加
    tempAssignments.push({
      id: `temp-${Date.now()}-${nextStaff.id}`,
      date: requirement.date,
      location_id: requirement.location_id,
      duty_code_id: requirement.duty_code_id,
      staff_id: nextStaff.id,
      is_responsible: nextStaff.roles?.is_responsible || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }

  return {
    selectedStaff: selected,
    validation: {
      isValid: errors.length === 0,
      errors,
      warnings,
    },
  }
}

/**
 * 全体の割り当て結果を検証
 */
export function validateAllAssignments(
  requirements: PositionRequirement[],
  assignments: Shift[]
): ConstraintValidationResult {
  const allErrors: string[] = []
  const allWarnings: string[] = []

  requirements.forEach((req) => {
    const validation = validatePositionFulfillment(req, assignments)
    allErrors.push(...validation.errors.map((e) => `[${req.date} ${req.dutyCode.name}] ${e}`))
    allWarnings.push(...validation.warnings.map((w) => `[${req.date} ${req.dutyCode.name}] ${w}`))
  })

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  }
}
