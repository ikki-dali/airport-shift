# TICKET-015: シフト一覧・確定機能

## ステータス
📋 未着手

## 優先度
⭐⭐⭐⭐ 高

## 複雑度
Medium

## 概要
作成済みシフトの一覧表示と確定処理

## 成果物
- [ ] `/app/shifts/page.tsx` - シフト一覧ページ
- [ ] `/lib/actions/shifts.ts` - Server Actions（拡張）
- [ ] `/components/shifts/ShiftListTable.tsx` - シフト一覧テーブル
- [ ] `/components/shifts/ConfirmDialog.tsx` - 確定ダイアログ
- [ ] `/components/shifts/ConstraintSummary.tsx` - 制約チェックサマリー

## 依存関係
- TICKET-010: ドラッグ&ドロップ実装
- TICKET-011: 制約チェック機能

## 機能要件

### シフト一覧表示

#### フィルタリング
- 年月選択
- ステータスフィルタ（予定/確定/変更/キャンセル）
- スタッフフィルタ
- 配属箇所フィルタ

#### 表示項目
- 日付
- スタッフ名
- 配属箇所
- 勤務記号
- 開始・終了時刻
- ステータス
- 作成日時
- 更新日時

#### ソート機能
- 日付順
- スタッフ名順
- 配属箇所順
- 更新日時順

#### 表示形式切り替え
- テーブル形式
- カレンダー形式
- グルーピング表示（日付別/スタッフ別/配属箇所別）

### 確定機能

#### 確定前のチェック
1. 制約違反の確認
   - エラーがある場合は確定不可
   - 警告がある場合は確認ダイアログ表示
2. 未割り当ての確認
   - 全ての必要箇所に人員が配置されているか
3. スタッフの確認
   - 全スタッフに適切にシフトが割り当てられているか

#### 確定処理
- ステータスを「予定」→「確定」に変更
- 一括確定
  - 月次単位での確定
  - 日付範囲指定での確定
- 個別確定
  - シフト単位での確定

#### 確定後の制限
- 確定済みシフトは編集不可（警告表示）
- 確定解除機能（管理者のみ）

## UI設計

### シフト一覧画面
```
+--------------------------------------------------+
| シフト一覧                                         |
+--------------------------------------------------+
| 年月: [2025-12 ▼]  ステータス: [全て ▼]           |
| スタッフ: [全員 ▼]  配属箇所: [全て ▼]             |
|                                                  |
| 表示: [⚫テーブル] [○カレンダー] [○グループ]       |
|                                                  |
| [制約チェック実行] [月次確定]                       |
+--------------------------------------------------+
| 制約チェック結果:                                  |
| ✅ 制約違反なし (確定可能)                         |
+--------------------------------------------------+
| 日付       | スタッフ | 配属箇所 | 記号 | ステータス | 操作 |
+--------------------------------------------------+
| 2025-12-01 | 山田太郎 | T3中央 | 06G5DA | 予定 | [確定][編集][削除] |
| 2025-12-01 | 佐藤花子 | T3北   | 06J0AW | 予定 | [確定][編集][削除] |
| 2025-12-02 | 山田太郎 | T3中央 | 14A5AA | 確定 | [確定解除] |
+--------------------------------------------------+
```

### 確定ダイアログ
```
+--------------------------------------------------+
| シフト確定確認                                     |
+--------------------------------------------------+
| 対象: 2025年12月分のシフト                         |
| 件数: 450件                                       |
|                                                  |
| 制約チェック結果:                                  |
| ❌ エラー: 3件                                    |
| - T3中央 (12/1): 必要人数不足 (4/5名)             |
| - T3北 (12/5): 責任者未配置 (0/1名)               |
| - バス案内 (12/10): 必要タグ不足 (バス案内)       |
|                                                  |
| ⚠️ エラーがあるため確定できません                  |
|                                                  |
| [キャンセル]                                      |
+--------------------------------------------------+
```

または

```
+--------------------------------------------------+
| シフト確定確認                                     |
+--------------------------------------------------+
| 対象: 2025年12月分のシフト                         |
| 件数: 450件                                       |
|                                                  |
| 制約チェック結果:                                  |
| ✅ エラーなし                                     |
| ⚠️ 警告: 2件                                      |
| - 山田太郎 (12/10): 連続勤務7日目                 |
| - 佐藤花子 (12/15): 夜勤明け勤務                  |
|                                                  |
| 警告がありますが確定しますか?                       |
|                                                  |
| [キャンセル] [確定する]                            |
+--------------------------------------------------+
```

## 実装例

### ShiftListTable.tsx
```typescript
'use client'

import { useState } from 'react'
import { Shift } from '@/types'

interface ShiftListTableProps {
  shifts: Shift[]
  onConfirm: (shiftIds: string[]) => void
  onEdit: (shiftId: string) => void
  onDelete: (shiftId: string) => void
}

export function ShiftListTable({
  shifts,
  onConfirm,
  onEdit,
  onDelete,
}: ShiftListTableProps) {
  const [selectedShifts, setSelectedShifts] = useState<string[]>([])

  const handleSelectAll = () => {
    if (selectedShifts.length === shifts.length) {
      setSelectedShifts([])
    } else {
      setSelectedShifts(shifts.map((s) => s.id))
    }
  }

  const handleConfirmSelected = () => {
    onConfirm(selectedShifts)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <input
            type="checkbox"
            checked={selectedShifts.length === shifts.length}
            onChange={handleSelectAll}
            className="mr-2"
          />
          <span>全選択 ({selectedShifts.length}件選択中)</span>
        </div>
        {selectedShifts.length > 0 && (
          <button
            onClick={handleConfirmSelected}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            選択したシフトを確定
          </button>
        )}
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2"></th>
            <th className="border p-2">日付</th>
            <th className="border p-2">スタッフ</th>
            <th className="border p-2">配属箇所</th>
            <th className="border p-2">勤務記号</th>
            <th className="border p-2">時間</th>
            <th className="border p-2">ステータス</th>
            <th className="border p-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {shifts.map((shift) => (
            <tr key={shift.id} className="hover:bg-gray-50">
              <td className="border p-2 text-center">
                <input
                  type="checkbox"
                  checked={selectedShifts.includes(shift.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedShifts([...selectedShifts, shift.id])
                    } else {
                      setSelectedShifts(selectedShifts.filter((id) => id !== shift.id))
                    }
                  }}
                  disabled={shift.status === '確定'}
                />
              </td>
              <td className="border p-2">{shift.date}</td>
              <td className="border p-2">{shift.staff.name}</td>
              <td className="border p-2">{shift.location.location_name}</td>
              <td className="border p-2">{shift.duty_code.code}</td>
              <td className="border p-2">
                {shift.duty_code.start_time} - {shift.duty_code.end_time}
              </td>
              <td className="border p-2">
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    shift.status === '確定'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {shift.status}
                </span>
              </td>
              <td className="border p-2">
                <div className="flex gap-2">
                  {shift.status === '予定' && (
                    <>
                      <button
                        onClick={() => onConfirm([shift.id])}
                        className="text-blue-600 hover:underline"
                      >
                        確定
                      </button>
                      <button
                        onClick={() => onEdit(shift.id)}
                        className="text-gray-600 hover:underline"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => onDelete(shift.id)}
                        className="text-red-600 hover:underline"
                      >
                        削除
                      </button>
                    </>
                  )}
                  {shift.status === '確定' && (
                    <button className="text-gray-400 cursor-not-allowed">
                      確定済み
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### Server Actions
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { validateShifts } from '@/lib/validators/shift-validator'
import { revalidatePath } from 'next/cache'

export async function confirmShifts(
  shiftIds: string[],
  options?: {
    skipWarnings?: boolean
  }
) {
  const supabase = await createClient()

  // 対象シフトを取得
  const { data: shifts, error: fetchError } = await supabase
    .from('shifts')
    .select('*')
    .in('id', shiftIds)

  if (fetchError) throw fetchError

  // 制約チェック
  // TODO: requirements も取得して validateShifts に渡す
  const violations = validateShifts({
    shifts,
    requirements: [], // 実際は requirements も取得
    date: shifts[0]?.date || '',
  })

  const errors = violations.filter((v) => v.severity === 'error')
  const warnings = violations.filter((v) => v.severity === 'warning')

  // エラーがある場合は確定不可
  if (errors.length > 0) {
    throw new Error(`制約違反があるため確定できません: ${errors.map((e) => e.message).join(', ')}`)
  }

  // 警告がある場合は確認
  if (warnings.length > 0 && !options?.skipWarnings) {
    return {
      needsConfirmation: true,
      warnings: warnings.map((w) => w.message),
    }
  }

  // ステータスを「確定」に変更
  const userId = await getCurrentUserId()

  const { error: updateError } = await supabase
    .from('shifts')
    .update({
      status: '確定',
      updated_by: userId,
    })
    .in('id', shiftIds)

  if (updateError) throw updateError

  revalidatePath('/shifts')

  return { success: true }
}

export async function confirmMonthShifts(yearMonth: string) {
  const supabase = await createClient()

  // 対象月の全シフトIDを取得
  const { data: shifts } = await supabase
    .from('shifts')
    .select('id')
    .gte('date', `${yearMonth}-01`)
    .lt('date', `${yearMonth}-32`)
    .eq('status', '予定')

  if (!shifts || shifts.length === 0) {
    throw new Error('確定対象のシフトがありません')
  }

  const shiftIds = shifts.map((s) => s.id)

  return confirmShifts(shiftIds)
}
```

## テスト項目
- [ ] シフト一覧が表示される
- [ ] フィルタリングが機能する
- [ ] ソートが機能する
- [ ] 個別確定ができる
- [ ] 一括確定ができる
- [ ] 制約チェックが実行される
- [ ] エラーがある場合は確定できない
- [ ] 警告がある場合は確認ダイアログが表示される
- [ ] 確定済みシフトは編集不可

## 完了条件
- [ ] シフト一覧が正しく表示される
- [ ] 確定機能が正しく動作する
- [ ] 制約チェックと連携している
- [ ] UI/UXが直感的

## 見積もり工数
8-10時間

## 開始予定日
2025-11-26

## 完了予定日
2025-11-27
