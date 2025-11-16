# TICKET-011: 制約チェック機能 - リアルタイムバリデーション

## ステータス
📋 未着手

## 優先度
⭐⭐⭐⭐⭐ 最高

## 複雑度
Complex

## 概要
シフト割り当て時の制約違反を即座に検出・警告表示

## 成果物
- [ ] `/lib/validators/shift-validator.ts` - バリデーションロジック
- [ ] `/components/shifts/ConstraintWarnings.tsx` - 警告表示コンポーネント
- [ ] `/components/shifts/LocationStatus.tsx` - 配置状況表示
- [ ] `/hooks/useConstraintCheck.ts` - 制約チェックフック

## 依存関係
- TICKET-010: ドラッグ&ドロップ実装

## 機能要件

### 制約チェックの種類

#### 1. 必要人数チェック ⭐⭐⭐⭐⭐ (エラー)
- 配属箇所ごとの最低人数を満たしているか
- 不足している場合はエラー表示
- 超過している場合は警告表示

#### 2. 責任者配置チェック ⭐⭐⭐⭐⭐ (エラー)
- 必要な配属箇所に責任者が配置されているか
- 責任者不足の場合はエラー表示

#### 3. 必要タグチェック ⭐⭐⭐⭐⭐ (エラー)
- 配属箇所の必要タグを持つ人が配置されているか
- タグ不足の場合はエラー表示

#### 4. 夜勤明けルールチェック ⭐⭐⭐ (警告) - 将来実装
- 夜勤翌日の勤務制限
- 違反の場合は警告表示

#### 5. 連続勤務制限チェック ⭐⭐⭐ (警告) - 将来実装
- 連続勤務日数の上限チェック
- 違反の場合は警告表示

## ConstraintViolation型（既存）

```typescript
interface ConstraintViolation {
  type: 'insufficient_staff' | 'missing_responsible' | 'missing_required_tag' | 'night_shift_rule' | 'consecutive_work_limit'
  severity: 'error' | 'warning'
  message: string
  location_id?: string
  staff_id?: string
  date?: string
}
```

## バリデーションロジック実装

### shift-validator.ts
```typescript
import type { ConstraintViolation } from '@/types'

interface ValidationContext {
  shifts: Array<{
    id: string
    staff_id: string
    location_id: string
    duty_code_id: string
    date: string
    staff: {
      role: { is_responsible: boolean }
      tags: string[]
    }
  }>
  requirements: Array<{
    location_id: string
    duty_code_id: string
    required_staff_count: number
    required_responsible_count: number
    required_tags: string[]
    day_of_week: number | null
    specific_date: string | null
  }>
  date: string
}

/**
 * 必要人数チェック
 */
export function checkStaffCount(
  locationId: string,
  dutyCodeId: string,
  context: ValidationContext
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = []

  // 該当する要件を取得
  const requirement = getRequirement(locationId, dutyCodeId, context.date, context.requirements)

  if (!requirement) return violations

  // 割り当て済みスタッフ数を取得
  const assignedCount = context.shifts.filter(
    (s) => s.location_id === locationId && s.duty_code_id === dutyCodeId && s.date === context.date
  ).length

  // 不足チェック
  if (assignedCount < requirement.required_staff_count) {
    violations.push({
      type: 'insufficient_staff',
      severity: 'error',
      message: `必要人数が不足しています（${assignedCount}/${requirement.required_staff_count}名）`,
      location_id: locationId,
      date: context.date,
    })
  }

  // 超過チェック
  if (assignedCount > requirement.required_staff_count) {
    violations.push({
      type: 'insufficient_staff',
      severity: 'warning',
      message: `必要人数を超過しています（${assignedCount}/${requirement.required_staff_count}名）`,
      location_id: locationId,
      date: context.date,
    })
  }

  return violations
}

/**
 * 責任者配置チェック
 */
export function checkResponsibleStaff(
  locationId: string,
  dutyCodeId: string,
  context: ValidationContext
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = []

  const requirement = getRequirement(locationId, dutyCodeId, context.date, context.requirements)

  if (!requirement || requirement.required_responsible_count === 0) {
    return violations
  }

  // 割り当て済み責任者数を取得
  const responsibleCount = context.shifts.filter(
    (s) =>
      s.location_id === locationId &&
      s.duty_code_id === dutyCodeId &&
      s.date === context.date &&
      s.staff.role.is_responsible
  ).length

  if (responsibleCount < requirement.required_responsible_count) {
    violations.push({
      type: 'missing_responsible',
      severity: 'error',
      message: `責任者が不足しています（${responsibleCount}/${requirement.required_responsible_count}名）`,
      location_id: locationId,
      date: context.date,
    })
  }

  return violations
}

/**
 * 必要タグチェック
 */
export function checkRequiredTags(
  locationId: string,
  dutyCodeId: string,
  context: ValidationContext
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = []

  const requirement = getRequirement(locationId, dutyCodeId, context.date, context.requirements)

  if (!requirement || !requirement.required_tags || requirement.required_tags.length === 0) {
    return violations
  }

  // 割り当て済みスタッフ
  const assignedStaff = context.shifts.filter(
    (s) => s.location_id === locationId && s.duty_code_id === dutyCodeId && s.date === context.date
  )

  // 各必要タグについて、少なくとも1人が持っているかチェック
  requirement.required_tags.forEach((requiredTag) => {
    const hasTag = assignedStaff.some((s) => s.staff.tags.includes(requiredTag))

    if (!hasTag) {
      violations.push({
        type: 'missing_required_tag',
        severity: 'error',
        message: `必要なタグを持つスタッフが配置されていません: ${requiredTag}`,
        location_id: locationId,
        date: context.date,
      })
    }
  })

  return violations
}

/**
 * 全制約チェック
 */
export function validateShifts(context: ValidationContext): ConstraintViolation[] {
  const violations: ConstraintViolation[] = []

  // 配属箇所×勤務記号の組み合わせごとにチェック
  const combinations = new Set<string>()

  context.shifts.forEach((shift) => {
    combinations.add(`${shift.location_id}-${shift.duty_code_id}`)
  })

  combinations.forEach((combo) => {
    const [locationId, dutyCodeId] = combo.split('-')

    violations.push(...checkStaffCount(locationId, dutyCodeId, context))
    violations.push(...checkResponsibleStaff(locationId, dutyCodeId, context))
    violations.push(...checkRequiredTags(locationId, dutyCodeId, context))
  })

  return violations
}

/**
 * 要件取得ヘルパー
 */
function getRequirement(
  locationId: string,
  dutyCodeId: string,
  date: string,
  requirements: ValidationContext['requirements']
) {
  const dayOfWeek = new Date(date).getDay()

  // 優先順位: 特定日 > 曜日 > デフォルト
  return (
    requirements.find(
      (r) => r.location_id === locationId && r.duty_code_id === dutyCodeId && r.specific_date === date
    ) ||
    requirements.find(
      (r) => r.location_id === locationId && r.duty_code_id === dutyCodeId && r.day_of_week === dayOfWeek
    ) ||
    requirements.find(
      (r) =>
        r.location_id === locationId &&
        r.duty_code_id === dutyCodeId &&
        r.day_of_week === null &&
        r.specific_date === null
    )
  )
}
```

## UI実装

### ConstraintWarnings.tsx
```typescript
interface ConstraintWarningsProps {
  violations: ConstraintViolation[]
}

export function ConstraintWarnings({ violations }: ConstraintWarningsProps) {
  const errors = violations.filter((v) => v.severity === 'error')
  const warnings = violations.filter((v) => v.severity === 'warning')

  if (violations.length === 0) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded">
        <div className="flex items-center text-green-700">
          <span className="mr-2">✅</span>
          <span>制約違反はありません</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {errors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <div className="font-semibold text-red-700 mb-2">
            ❌ エラー ({errors.length}件)
          </div>
          <ul className="space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-red-600">
                • {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <div className="font-semibold text-yellow-700 mb-2">
            ⚠️ 警告 ({warnings.length}件)
          </div>
          <ul className="space-y-1">
            {warnings.map((warning, index) => (
              <li key={index} className="text-sm text-yellow-600">
                • {warning.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
```

### LocationStatus.tsx
```typescript
interface LocationStatusProps {
  currentCount: number
  requiredCount: number
  responsibleCount: number
  requiredResponsible: number
  missingTags: string[]
}

export function LocationStatus({
  currentCount,
  requiredCount,
  responsibleCount,
  requiredResponsible,
  missingTags,
}: LocationStatusProps) {
  const isStaffOk = currentCount >= requiredCount
  const isResponsibleOk = responsibleCount >= requiredResponsible
  const isTagsOk = missingTags.length === 0

  return (
    <div className="space-y-2">
      {/* 人数状況 */}
      <div className="flex items-center">
        <span className={isStaffOk ? 'text-green-600' : 'text-red-600'}>
          {isStaffOk ? '✅' : '❌'}
        </span>
        <span className="ml-2">
          人数: {currentCount} / {requiredCount}名
        </span>
      </div>

      {/* 責任者状況 */}
      {requiredResponsible > 0 && (
        <div className="flex items-center">
          <span className={isResponsibleOk ? 'text-green-600' : 'text-red-600'}>
            {isResponsibleOk ? '✅' : '❌'}
          </span>
          <span className="ml-2">
            責任者: {responsibleCount} / {requiredResponsible}名
          </span>
        </div>
      )}

      {/* タグ状況 */}
      <div className="flex items-center">
        <span className={isTagsOk ? 'text-green-600' : 'text-red-600'}>
          {isTagsOk ? '✅' : '❌'}
        </span>
        <span className="ml-2">
          {isTagsOk ? '必要タグ満たしています' : `不足タグ: ${missingTags.join(', ')}`}
        </span>
      </div>
    </div>
  )
}
```

## カスタムフック

### useConstraintCheck.ts
```typescript
import { useMemo } from 'react'
import { validateShifts } from '@/lib/validators/shift-validator'

export function useConstraintCheck(
  shifts: any[],
  requirements: any[],
  date: string
) {
  const violations = useMemo(() => {
    return validateShifts({ shifts, requirements, date })
  }, [shifts, requirements, date])

  const hasErrors = violations.some((v) => v.severity === 'error')
  const hasWarnings = violations.some((v) => v.severity === 'warning')

  return {
    violations,
    hasErrors,
    hasWarnings,
    isValid: !hasErrors,
  }
}
```

## テスト項目
- [ ] 必要人数不足がエラーとして検出される
- [ ] 必要人数超過が警告として検出される
- [ ] 責任者不足がエラーとして検出される
- [ ] 必要タグ不足がエラーとして検出される
- [ ] 制約違反が画面に表示される
- [ ] 配置状況が正しく表示される
- [ ] リアルタイムで制約チェックが実行される
- [ ] エラーがある場合は確定ボタンが無効化される

## 完了条件
- [ ] 3つの基本制約チェックが正しく機能する
- [ ] 制約違反が視覚的にわかりやすく表示される
- [ ] パフォーマンスが良好（150名でも遅延なし）

## 見積もり工数
8-10時間

## 開始予定日
2025-11-24

## 完了予定日
2025-11-25
