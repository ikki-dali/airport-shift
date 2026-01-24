import type { StaffWithRole, DutyCode, Shift, ShiftRequest } from './types'
import { scoreStaffAssignment, calculateStats, calculateTotalScore } from './scoring'
import {
  selectOptimalStaffMultiple,
  validateAllAssignments,
  type PositionRequirement,
  type ConstraintValidationResult,
} from './constraint-solver'

export interface OptimizationOptions {
  /**
   * 局所探索を適用するかどうか
   */
  applyLocalSearch?: boolean

  /**
   * 局所探索の最大イテレーション数
   */
  maxLocalSearchIterations?: number

  /**
   * タイムアウト（ミリ秒）
   */
  timeoutMs?: number
}

export interface OptimizationResult {
  /**
   * 生成されたシフト割り当て
   */
  assignments: Shift[]

  /**
   * 検証結果
   */
  validation: ConstraintValidationResult

  /**
   * 統計情報
   */
  stats: ReturnType<typeof calculateStats>

  /**
   * 合計スコア
   */
  totalScore: number

  /**
   * 処理時間（ミリ秒）
   */
  processingTimeMs: number
}

/**
 * メイン最適化関数 - Greedy アルゴリズム + 局所探索
 */
export async function optimizeShiftAssignments(
  requirements: PositionRequirement[],
  allStaff: StaffWithRole[],
  shiftRequests: ShiftRequest[],
  options: OptimizationOptions = {}
): Promise<OptimizationResult> {
  const startTime = Date.now()
  const {
    applyLocalSearch = true,
    maxLocalSearchIterations = 100,
    timeoutMs = 30000,
  } = options

  // フェーズ1: Greedy割り当て
  let assignments = greedyAssign(requirements, allStaff, shiftRequests, timeoutMs)

  // フェーズ2: 局所探索による改善（オプション）
  if (applyLocalSearch) {
    assignments = localSearchOptimization(
      assignments,
      requirements,
      allStaff,
      shiftRequests,
      maxLocalSearchIterations,
      startTime + timeoutMs
    )
  }

  const processingTimeMs = Date.now() - startTime

  // 検証と統計
  const validation = validateAllAssignments(requirements, assignments)
  const stats = calculateStats(assignments, shiftRequests, allStaff)
  const totalScore = calculateTotalScore(assignments, shiftRequests)

  return {
    assignments,
    validation,
    stats,
    totalScore,
    processingTimeMs,
  }
}

/**
 * Greedyアルゴリズム - 各位置に対して最適なスタッフを順次割り当て
 */
function greedyAssign(
  requirements: PositionRequirement[],
  allStaff: StaffWithRole[],
  shiftRequests: ShiftRequest[],
  timeoutMs: number
): Shift[] {
  const assignments: Shift[] = []
  const startTime = Date.now()

  // 要件を優先度順にソート（責任者要件のある位置を優先）
  const sortedRequirements = [...requirements].sort((a, b) => {
    if (a.requires_responsible && !b.requires_responsible) return -1
    if (!a.requires_responsible && b.requires_responsible) return 1
    // 必要タグ数が多い方を優先
    return b.required_tags.length - a.required_tags.length
  })

  for (const requirement of sortedRequirements) {
    // タイムアウトチェック
    if (Date.now() - startTime > timeoutMs) {
      console.warn('Greedy assignment timed out')
      break
    }

    // この位置に対するスコアリング関数を作成
    const scoringFn = (staff: StaffWithRole) =>
      scoreStaffAssignment(
        staff,
        requirement.date,
        requirement.dutyCode,
        shiftRequests,
        assignments
      )

    // 最適なスタッフを選択
    const result = selectOptimalStaffMultiple(
      requirement,
      allStaff,
      assignments,
      shiftRequests,
      scoringFn
    )

    // 割り当てを追加
    result.selectedStaff.forEach((staff, index) => {
      assignments.push({
        id: `auto-${requirement.date}-${requirement.location_id}-${requirement.duty_code_id}-${index}`,
        date: requirement.date,
        location_id: requirement.location_id,
        duty_code_id: requirement.duty_code_id,
        staff_id: staff.id,
        is_responsible: requirement.requires_responsible && index === 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    })
  }

  return assignments
}

/**
 * 局所探索による最適化 - スタッフの入れ替えでスコア改善を試みる
 */
function localSearchOptimization(
  initialAssignments: Shift[],
  requirements: PositionRequirement[],
  allStaff: StaffWithRole[],
  shiftRequests: ShiftRequest[],
  maxIterations: number,
  deadline: number
): Shift[] {
  let currentAssignments = [...initialAssignments]
  let currentScore = calculateTotalScore(currentAssignments, shiftRequests)
  let improved = true
  let iteration = 0

  while (improved && iteration < maxIterations && Date.now() < deadline) {
    improved = false
    iteration++

    // 各割り当てに対して改善を試みる
    for (let i = 0; i < currentAssignments.length; i++) {
      const assignment = currentAssignments[i]

      // この位置の要件を見つける
      const requirement = requirements.find(
        (r) =>
          r.date === assignment.date &&
          r.location_id === assignment.location_id &&
          r.duty_code_id === assignment.duty_code_id
      )

      if (!requirement) continue

      // この位置に割り当てられているスタッフ以外を試す
      const otherStaff = allStaff.filter((s) => s.id !== assignment.staff_id)

      for (const candidateStaff of otherStaff) {
        // タイムアウトチェック
        if (Date.now() >= deadline) break

        // 候補スタッフと入れ替えた場合の新しい割り当て
        const newAssignments = [...currentAssignments]
        newAssignments[i] = {
          ...assignment,
          staff_id: candidateStaff.id,
          is_responsible: (candidateStaff.roles?.is_responsible || false) && assignment.is_responsible,
        }

        // 制約チェック（簡易版 - 同日重複のみ）
        const hasDuplicateOnSameDay = newAssignments.some(
          (a, idx) =>
            idx !== i &&
            a.staff_id === candidateStaff.id &&
            a.date === assignment.date
        )

        if (hasDuplicateOnSameDay) continue

        // 責任者要件チェック
        if (requirement.requires_responsible && !candidateStaff.roles?.is_responsible) {
          continue
        }

        // タグ要件チェック
        const staffTags = candidateStaff.tags || []
        const hasAllTags = requirement.required_tags.every((tag) =>
          staffTags.includes(tag)
        )
        if (!hasAllTags) continue

        // スコア計算
        const newScore = calculateTotalScore(newAssignments, shiftRequests)

        // スコアが改善された場合は採用
        if (newScore > currentScore) {
          currentAssignments = newAssignments
          currentScore = newScore
          improved = true
          break // この位置の改善が見つかったので次の位置へ
        }
      }

      if (improved) break // 改善が見つかったので最初から再開
    }
  }

  console.log(`Local search completed: ${iteration} iterations, final score: ${currentScore}`)
  return currentAssignments
}

/**
 * 部分的な自動割り当て - 特定の日付範囲や場所のみを最適化
 */
export async function optimizePartialAssignments(
  requirements: PositionRequirement[],
  existingAssignments: Shift[],
  allStaff: StaffWithRole[],
  shiftRequests: ShiftRequest[],
  filters: {
    dateRange?: { start: string; end: string }
    locationIds?: string[]
    dutyCodeIds?: string[]
  },
  options: OptimizationOptions = {}
): Promise<OptimizationResult> {
  // フィルタに合致する要件のみを抽出
  const filteredRequirements = requirements.filter((req) => {
    if (filters.dateRange) {
      if (req.date < filters.dateRange.start || req.date > filters.dateRange.end) {
        return false
      }
    }
    if (filters.locationIds && !filters.locationIds.includes(req.location_id)) {
      return false
    }
    if (filters.dutyCodeIds && !filters.dutyCodeIds.includes(req.duty_code_id)) {
      return false
    }
    return true
  })

  // フィルタに合致しない既存の割り当ては保持
  const preservedAssignments = existingAssignments.filter((assign) => {
    const matchesFilter = filteredRequirements.some(
      (req) =>
        req.date === assign.date &&
        req.location_id === assign.location_id &&
        req.duty_code_id === assign.duty_code_id
    )
    return !matchesFilter
  })

  // フィルタに合致する部分を最適化
  const result = await optimizeShiftAssignments(
    filteredRequirements,
    allStaff,
    shiftRequests,
    options
  )

  // 保持した割り当てと新しい割り当てを結合
  const combinedAssignments = [...preservedAssignments, ...result.assignments]

  // 全体を再検証
  const validation = validateAllAssignments(requirements, combinedAssignments)
  const stats = calculateStats(combinedAssignments, shiftRequests, allStaff)
  const totalScore = calculateTotalScore(combinedAssignments, shiftRequests)

  return {
    assignments: combinedAssignments,
    validation,
    stats,
    totalScore,
    processingTimeMs: result.processingTimeMs,
  }
}
