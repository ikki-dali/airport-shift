# TICKET-009: シフト作成画面 - 基本UI構築

## ステータス
📋 未着手

## 優先度
⭐⭐⭐⭐⭐ 最高

## 複雑度
Complex

## 概要
カレンダー/テーブル形式でのシフト割り当て画面の基本UI構築

## 成果物
- [ ] `/app/shifts/create/page.tsx` - シフト作成ページ
- [ ] `/components/shifts/` - 関連コンポーネント
  - `ShiftCalendar.tsx` - カレンダー表示
  - `StaffList.tsx` - スタッフ一覧（ドラッグ元）
  - `LocationGrid.tsx` - 配属箇所グリッド（ドロップ先）
  - `AssignedShifts.tsx` - 割り当て済みシフト一覧
  - `ShiftControls.tsx` - コントロールパネル

## 依存関係
- TICKET-002: データベーススキーマ構築
- TICKET-005: スタッフ管理
- TICKET-006: 配属箇所管理

## 機能要件

### レイアウト構成

```
+--------------------------------------------------+
| [年月選択: 2025-12 ▼]         [保存] [確定]      |
+--------------------------------------------------+
| スタッフ一覧     | カレンダー/配属箇所グリッド       |
| (ドラッグ元)     | (ドロップ先)                    |
|                 |                                |
| 🔍検索          | 2025年12月                      |
| [_________]     |                                |
|                 | 配属箇所: [T3中央 ▼]            |
| 山田太郎        | 勤務記号: [06G5DA ▼]            |
| (一般)          |                                |
| タグ: 保安検査  | 12/1 (月)                      |
|                 | +----------------------------+ |
| 佐藤花子        | | [ドロップエリア]              | |
| (リーダー)      | | 割り当て済み:                | |
| タグ: バス案内  | | - 田中太郎 (責任者)          | |
|                 | | - 鈴木花子                   | |
|                 | | 必要: 5名 / 配置: 2名        | |
|                 | +----------------------------+ |
|                 |                                |
| ...             | 12/2 (火)                      |
|                 | ...                            |
+--------------------------------------------------+
```

### スタッフ一覧（左サイドバー）
- 全スタッフ表示
- 検索機能
  - 氏名検索
  - 社員番号検索
- フィルタリング
  - 役職フィルタ
  - タグフィルタ
  - 未割り当てのみ表示
- 表示情報
  - スタッフ名
  - 役職
  - 保有タグ
  - その日の希望（あれば）
  - 割り当て状況（割り当て済み/未割り当て）

### カレンダー/配属箇所グリッド（メインエリア）
- 年月選択
- 日付選択（カレンダーまたはドロップダウン）
- 配属箇所選択
- 勤務記号選択
- ドロップエリア
  - 配属箇所ごとのスロット
  - 割り当て済みスタッフ表示
  - 充足状況表示（必要数/配置数）
  - 責任者配置状況

### コントロールパネル
- 年月選択
- 日付選択
- 配属箇所選択
- 勤務記号選択
- 保存ボタン
- 確定ボタン
- クリアボタン

### 割り当て済みシフト表示
- 日付別の一覧
- スタッフ別の一覧
- 配属箇所別の一覧
- 削除機能

## UI設計詳細

### スタッフカード
```typescript
interface StaffCardProps {
  staff: {
    id: string
    name: string
    role: string
    tags: string[]
    todayRequest?: string
    isAssigned: boolean
  }
}

// 表示例
+----------------------------------+
| 山田太郎 (リーダー) 👑           |
| タグ: 保安検査, バス案内          |
| 希望: ◯                          |
| ✅ 割り当て済み                  |
+----------------------------------+
```

### 配属箇所ドロップゾーン
```typescript
interface DropZoneProps {
  location: {
    id: string
    name: string
  }
  dutyCode: {
    id: string
    code: string
  }
  date: string
  assignedStaff: {
    id: string
    name: string
    isResponsible: boolean
  }[]
  requirements: {
    requiredCount: number
    requiredResponsible: number
    requiredTags: string[]
  }
}

// 表示例
+----------------------------------+
| T3中央 - 06G5DA (6:30-11:45)     |
+----------------------------------+
| 割り当て済み: 2/5名              |
| 責任者: 1/1名 ✅                 |
+----------------------------------+
| 👑 山田太郎 (リーダー) [×]       |
| 佐藤花子 [×]                     |
+----------------------------------+
| [ドロップエリア]                 |
| スタッフをドラッグしてください    |
+----------------------------------+
```

## 状態管理

### Zustandストア設計
```typescript
import { create } from 'zustand'

interface ShiftStore {
  // 選択中の年月
  selectedYearMonth: string
  setSelectedYearMonth: (yearMonth: string) => void

  // 選択中の日付
  selectedDate: string | null
  setSelectedDate: (date: string | null) => void

  // 選択中の配属箇所
  selectedLocation: string | null
  setSelectedLocation: (locationId: string | null) => void

  // 選択中の勤務記号
  selectedDutyCode: string | null
  setSelectedDutyCode: (dutyCodeId: string | null) => void

  // 割り当て済みシフト
  shifts: Shift[]
  addShift: (shift: Shift) => void
  removeShift: (shiftId: string) => void
  updateShift: (shiftId: string, shift: Partial<Shift>) => void

  // フィルタ
  staffFilter: {
    search: string
    roleId: string | null
    tags: string[]
    showUnassignedOnly: boolean
  }
  setStaffFilter: (filter: Partial<ShiftStore['staffFilter']>) => void
}

export const useShiftStore = create<ShiftStore>((set) => ({
  selectedYearMonth: new Date().toISOString().slice(0, 7),
  setSelectedYearMonth: (yearMonth) => set({ selectedYearMonth: yearMonth }),

  selectedDate: null,
  setSelectedDate: (date) => set({ selectedDate: date }),

  selectedLocation: null,
  setSelectedLocation: (locationId) => set({ selectedLocation: locationId }),

  selectedDutyCode: null,
  setSelectedDutyCode: (dutyCodeId) => set({ selectedDutyCode: dutyCodeId }),

  shifts: [],
  addShift: (shift) => set((state) => ({ shifts: [...state.shifts, shift] })),
  removeShift: (shiftId) =>
    set((state) => ({
      shifts: state.shifts.filter((s) => s.id !== shiftId),
    })),
  updateShift: (shiftId, shift) =>
    set((state) => ({
      shifts: state.shifts.map((s) => (s.id === shiftId ? { ...s, ...shift } : s)),
    })),

  staffFilter: {
    search: '',
    roleId: null,
    tags: [],
    showUnassignedOnly: false,
  },
  setStaffFilter: (filter) =>
    set((state) => ({
      staffFilter: { ...state.staffFilter, ...filter },
    })),
}))
```

## テスト項目
- [ ] シフト作成画面が表示される
- [ ] スタッフ一覧が表示される
- [ ] 配属箇所グリッドが表示される
- [ ] 年月選択が機能する
- [ ] 日付選択が機能する
- [ ] 配属箇所選択が機能する
- [ ] 勤務記号選択が機能する
- [ ] スタッフ検索が機能する
- [ ] スタッフフィルタが機能する
- [ ] 割り当て済みシフトが表示される
- [ ] 充足状況が表示される

## 注意事項
- このチケットではD&D機能は未実装
- 基本的なUI構築とデータ表示のみ
- TICKET-010でD&D機能を実装

## 完了条件
- [ ] 基本的なレイアウトが完成している
- [ ] スタッフ一覧が正しく表示される
- [ ] 配属箇所グリッドが正しく表示される
- [ ] 状態管理が正しく機能する
- [ ] UI/UXが直感的

## 見積もり工数
10-14時間

## 開始予定日
2025-11-21

## 完了予定日
2025-11-23
