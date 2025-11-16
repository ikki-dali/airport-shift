# TICKET-010: シフト作成画面 - ドラッグ&ドロップ実装

## ステータス
📋 未着手

## 優先度
⭐⭐⭐⭐⭐ 最高

## 複雑度
Complex

## 概要
スタッフを配属箇所にドラッグ&ドロップで割り当てる機能の実装

## 成果物
- [ ] D&Dライブラリの統合
- [ ] `/components/shifts/DraggableStaff.tsx` - ドラッグ可能なスタッフ
- [ ] `/components/shifts/DroppableLocation.tsx` - ドロップ可能な配属箇所
- [ ] `/lib/actions/shifts.ts` - シフトのServer Actions
- [ ] D&D後の自動保存機能

## 依存関係
- TICKET-009: シフト作成画面 - 基本UI構築

## D&Dライブラリの選定

### オプション1: @dnd-kit (推奨)
- React 19対応
- モダンなAPI
- アクセシビリティサポート
- TypeScript完全サポート

### オプション2: react-beautiful-dnd
- 成熟したライブラリ
- 使いやすいAPI
- ⚠️ React 19対応要確認

**決定**: @dnd-kitを使用

## 機能要件

### ドラッグ操作
- スタッフカードをドラッグ可能にする
- ドラッグ中の視覚的フィードバック
  - 半透明表示
  - カーソル変更
- ドラッグ可能/不可の判定
  - 既に割り当て済みのスタッフは非活性

### ドロップ操作
- 配属箇所エリアにドロップ可能
- ドロップ時のバリデーション
  - 同じ日に重複割り当て不可
  - 必要タグチェック（警告のみ）
- ドロップ成功時
  - shiftsテーブルにデータ保存
  - UIに反映
  - 成功メッセージ表示
- ドロップ失敗時
  - エラーメッセージ表示
  - 元の位置に戻る

### 削除操作
- 割り当て済みシフトの削除
- 確認ダイアログ表示
- 削除成功時
  - データベースから削除
  - UIに反映

### リアルタイム更新
- 割り当て後、即座にUI更新
- 充足状況の再計算
- 責任者配置状況の再計算

## 実装例（@dnd-kit）

### 1. セットアップ
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### 2. DndContext設定
```typescript
import { DndContext, DragEndEvent } from '@dnd-kit/core'

export default function ShiftCreatePage() {
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    // active.id = スタッフID
    // over.id = "location-{locationId}-dutyCode-{dutyCodeId}-date-{date}"

    const [, locationId, , dutyCodeId, , date] = over.id.toString().split('-')
    const staffId = active.id.toString()

    // バリデーション
    const existingShift = shifts.find(
      (s) => s.staff_id === staffId && s.date === date
    )

    if (existingShift) {
      toast.error('このスタッフは既に別の配属箇所に割り当てられています')
      return
    }

    // シフト作成
    await createShift({
      staffId,
      locationId,
      dutyCodeId,
      date,
      status: '予定',
    })

    toast.success('シフトを割り当てました')
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex">
        <StaffList />
        <LocationGrid />
      </div>
    </DndContext>
  )
}
```

### 3. DraggableStaff
```typescript
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

interface DraggableStaffProps {
  staff: {
    id: string
    name: string
    role: string
    tags: string[]
  }
  isAssigned: boolean
}

export function DraggableStaff({ staff, isAssigned }: DraggableStaffProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: staff.id,
    disabled: isAssigned,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        p-4 border rounded-lg cursor-move
        ${isAssigned ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
        ${isDragging ? 'ring-2 ring-blue-500' : ''}
      `}
    >
      <div className="font-semibold">{staff.name}</div>
      <div className="text-sm text-gray-600">{staff.role}</div>
      <div className="text-xs text-gray-500">
        {staff.tags.join(', ')}
      </div>
    </div>
  )
}
```

### 4. DroppableLocation
```typescript
import { useDroppable } from '@dnd-kit/core'

interface DroppableLocationProps {
  locationId: string
  dutyCodeId: string
  date: string
  assignedStaff: Array<{
    id: string
    name: string
    isResponsible: boolean
  }>
  requirements: {
    requiredCount: number
    requiredResponsible: number
  }
}

export function DroppableLocation({
  locationId,
  dutyCodeId,
  date,
  assignedStaff,
  requirements,
}: DroppableLocationProps) {
  const dropId = `location-${locationId}-dutyCode-${dutyCodeId}-date-${date}`
  const { setNodeRef, isOver } = useDroppable({ id: dropId })

  const isFull = assignedStaff.length >= requirements.requiredCount
  const hasEnoughResponsible =
    assignedStaff.filter((s) => s.isResponsible).length >= requirements.requiredResponsible

  return (
    <div
      ref={setNodeRef}
      className={`
        p-4 border-2 border-dashed rounded-lg min-h-[200px]
        ${isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
        ${isFull ? 'bg-green-50' : ''}
      `}
    >
      <div className="mb-2">
        <span className={`font-semibold ${isFull ? 'text-green-600' : 'text-orange-600'}`}>
          {assignedStaff.length} / {requirements.requiredCount}名
        </span>
        <span className={`ml-4 ${hasEnoughResponsible ? 'text-green-600' : 'text-red-600'}`}>
          責任者: {assignedStaff.filter((s) => s.isResponsible).length} / {requirements.requiredResponsible}名
        </span>
      </div>

      <div className="space-y-2">
        {assignedStaff.map((staff) => (
          <div
            key={staff.id}
            className="flex items-center justify-between p-2 bg-white rounded shadow"
          >
            <span>
              {staff.isResponsible && '👑 '}
              {staff.name}
            </span>
            <button
              onClick={() => handleRemoveStaff(staff.id)}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {!isFull && (
        <div className="mt-4 text-center text-gray-400">
          スタッフをドロップしてください
        </div>
      )}
    </div>
  )
}
```

### 5. Server Actions
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createShift(data: {
  staffId: string
  locationId: string
  dutyCodeId: string
  date: string
  status: string
}) {
  const supabase = await createClient()

  // 重複チェック
  const { data: existing } = await supabase
    .from('shifts')
    .select('id')
    .eq('staff_id', data.staffId)
    .eq('date', data.date)
    .single()

  if (existing) {
    throw new Error('このスタッフは既に別の配属箇所に割り当てられています')
  }

  const { error } = await supabase.from('shifts').insert({
    staff_id: data.staffId,
    location_id: data.locationId,
    duty_code_id: data.dutyCodeId,
    date: data.date,
    status: data.status,
  })

  if (error) throw error

  revalidatePath('/shifts/create')
}

export async function deleteShift(shiftId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('shifts')
    .delete()
    .eq('id', shiftId)

  if (error) throw error

  revalidatePath('/shifts/create')
}

export async function getShiftsByDate(date: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('shifts')
    .select(`
      *,
      staff (
        id,
        name,
        employee_number,
        roles (
          name,
          is_responsible
        )
      ),
      locations (
        id,
        location_name,
        code
      ),
      duty_codes (
        code,
        start_time,
        end_time
      )
    `)
    .eq('date', date)

  if (error) throw error
  return data
}
```

## バリデーション

### ドロップ時のチェック
1. 同一日の重複割り当てチェック ⭐⭐⭐⭐⭐
2. 必要タグチェック（警告のみ）⭐⭐⭐⭐
3. 責任者要件チェック（警告のみ）⭐⭐⭐⭐

### エラーメッセージ
- "このスタッフは既に別の配属箇所に割り当てられています"
- "必要なタグを持っていません: [タグ名]"
- "責任者が必要ですが、このスタッフは責任者ではありません"

## テスト項目
- [ ] スタッフをドラッグできる
- [ ] 配属箇所にドロップできる
- [ ] ドロップ後、データベースに保存される
- [ ] ドロップ後、UIに反映される
- [ ] 重複割り当てが防止される
- [ ] 割り当て済みシフトを削除できる
- [ ] 充足状況がリアルタイム更新される
- [ ] 責任者配置状況が表示される
- [ ] エラーメッセージが適切に表示される
- [ ] ドラッグ中の視覚的フィードバックが機能する

## パフォーマンス考慮
- 大量のスタッフ（150名）でもスムーズに動作
- 仮想化（react-window）の検討
- デバウンス処理

## 完了条件
- [ ] D&D機能が正しく動作する
- [ ] バリデーションが正しく機能する
- [ ] データベースへの保存が成功する
- [ ] UI/UXが直感的でスムーズ

## 見積もり工数
10-12時間

## 開始予定日
2025-11-23

## 完了予定日
2025-11-24
