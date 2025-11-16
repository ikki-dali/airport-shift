# TICKET-012: 制約チェック機能 - バリデーションロジック強化

## ステータス
📋 未着手

## 優先度
⭐⭐⭐ 中

## 複雑度
Medium

## 概要
制約チェックのビジネスロジックの拡張とテスト

## 成果物
- [ ] `/lib/validators/__tests__/shift-validator.test.ts` - ユニットテスト
- [ ] バリデーションロジックの最適化
- [ ] エッジケースの処理
- [ ] パフォーマンス改善

## 依存関係
- TICKET-011: リアルタイムバリデーション

## 機能要件

### バリデーションの拡張

#### 1. 複数要件パターンの優先順位処理
- 特定日 > 曜日 > デフォルトの優先順位
- 正しい要件が適用されているかの検証

#### 2. エラーメッセージの詳細化
- どの配属箇所で違反しているか明記
- 何名不足/超過しているか明記
- どのタグが不足しているか明記

#### 3. 将来実装の制約（基本ロジックのみ）

##### 夜勤明けルールチェック
```typescript
/**
 * 夜勤明けルールチェック
 * 夜勤の翌日は勤務不可または制限あり
 */
export function checkNightShiftRule(
  staffId: string,
  date: string,
  context: ValidationContext
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = []

  // 前日のシフトを取得
  const previousDate = new Date(date)
  previousDate.setDate(previousDate.getDate() - 1)
  const prevDateStr = previousDate.toISOString().split('T')[0]

  const previousShift = context.shifts.find(
    (s) => s.staff_id === staffId && s.date === prevDateStr
  )

  if (!previousShift) return violations

  // 夜勤判定（開始時刻が19:00以降）
  const dutyCode = context.dutyCodes.find(
    (dc) => dc.id === previousShift.duty_code_id
  )

  if (dutyCode && parseInt(dutyCode.start_time.split(':')[0]) >= 19) {
    violations.push({
      type: 'night_shift_rule',
      severity: 'warning',
      message: `前日が夜勤のため、勤務に制限があります`,
      staff_id: staffId,
      date: date,
    })
  }

  return violations
}
```

##### 連続勤務制限チェック
```typescript
/**
 * 連続勤務制限チェック
 * 連続勤務日数が上限を超えていないかチェック
 */
export function checkConsecutiveWorkLimit(
  staffId: string,
  date: string,
  context: ValidationContext,
  maxConsecutiveDays: number = 6
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = []

  // 対象日を含む前後の連続勤務日数をカウント
  let consecutiveDays = 1 // 対象日を含む

  // 過去方向にカウント
  let checkDate = new Date(date)
  while (true) {
    checkDate.setDate(checkDate.getDate() - 1)
    const checkDateStr = checkDate.toISOString().split('T')[0]

    const hasShift = context.shifts.some(
      (s) => s.staff_id === staffId && s.date === checkDateStr
    )

    if (hasShift) {
      consecutiveDays++
    } else {
      break
    }
  }

  // 未来方向にカウント
  checkDate = new Date(date)
  while (true) {
    checkDate.setDate(checkDate.getDate() + 1)
    const checkDateStr = checkDate.toISOString().split('T')[0]

    const hasShift = context.shifts.some(
      (s) => s.staff_id === staffId && s.date === checkDateStr
    )

    if (hasShift) {
      consecutiveDays++
    } else {
      break
    }
  }

  if (consecutiveDays > maxConsecutiveDays) {
    violations.push({
      type: 'consecutive_work_limit',
      severity: 'warning',
      message: `連続勤務日数が上限を超えています（${consecutiveDays}日）`,
      staff_id: staffId,
      date: date,
    })
  }

  return violations
}
```

### ユニットテスト

```typescript
import { describe, it, expect } from 'vitest'
import {
  checkStaffCount,
  checkResponsibleStaff,
  checkRequiredTags,
  validateShifts,
} from '../shift-validator'

describe('shift-validator', () => {
  describe('checkStaffCount', () => {
    it('必要人数不足の場合、エラーを返す', () => {
      const context = {
        shifts: [
          /* 3名のシフト */
        ],
        requirements: [
          {
            location_id: 'loc-1',
            duty_code_id: 'dc-1',
            required_staff_count: 5,
            required_responsible_count: 0,
            required_tags: [],
            day_of_week: null,
            specific_date: null,
          },
        ],
        date: '2025-12-01',
      }

      const violations = checkStaffCount('loc-1', 'dc-1', context)

      expect(violations).toHaveLength(1)
      expect(violations[0].type).toBe('insufficient_staff')
      expect(violations[0].severity).toBe('error')
    })

    it('必要人数を満たす場合、エラーを返さない', () => {
      const context = {
        shifts: [
          /* 5名のシフト */
        ],
        requirements: [
          {
            location_id: 'loc-1',
            duty_code_id: 'dc-1',
            required_staff_count: 5,
            required_responsible_count: 0,
            required_tags: [],
            day_of_week: null,
            specific_date: null,
          },
        ],
        date: '2025-12-01',
      }

      const violations = checkStaffCount('loc-1', 'dc-1', context)

      expect(violations).toHaveLength(0)
    })
  })

  describe('checkResponsibleStaff', () => {
    it('責任者不足の場合、エラーを返す', () => {
      // テストケース実装
    })
  })

  describe('checkRequiredTags', () => {
    it('必要タグが不足している場合、エラーを返す', () => {
      // テストケース実装
    })
  })
})
```

### パフォーマンス最適化

```typescript
// メモ化による最適化
import { useMemo } from 'react'

export function useOptimizedConstraintCheck(
  shifts: any[],
  requirements: any[],
  date: string
) {
  // shiftsとrequirementsをキーでグループ化して高速検索
  const shiftsMap = useMemo(() => {
    const map = new Map<string, any[]>()
    shifts.forEach((shift) => {
      const key = `${shift.location_id}-${shift.duty_code_id}-${shift.date}`
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(shift)
    })
    return map
  }, [shifts])

  const requirementsMap = useMemo(() => {
    const map = new Map<string, any>()
    requirements.forEach((req) => {
      const key = `${req.location_id}-${req.duty_code_id}`
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(req)
    })
    return map
  }, [requirements])

  const violations = useMemo(() => {
    return validateShifts({
      shifts,
      requirements,
      date,
      shiftsMap,
      requirementsMap,
    })
  }, [shifts, requirements, date, shiftsMap, requirementsMap])

  return violations
}
```

## テスト項目
- [ ] 必要人数不足のテストが通過する
- [ ] 必要人数超過のテストが通過する
- [ ] 責任者不足のテストが通過する
- [ ] 必要タグ不足のテストが通過する
- [ ] 要件優先順位のテストが通過する
- [ ] エッジケースのテストが通過する
- [ ] パフォーマンステストが通過する（1000シフトで<100ms）

## 完了条件
- [ ] 全ユニットテストが通過する
- [ ] パフォーマンスが最適化されている
- [ ] エッジケースが適切に処理されている
- [ ] 将来実装の制約ロジックの基本が準備されている

## 見積もり工数
6-8時間

## 並行開発可能
✅ TICKET-013（Excel/CSV出力）と並行開発可能

## 開始予定日
2025-11-24

## 完了予定日
2025-11-25
