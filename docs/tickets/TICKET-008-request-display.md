# TICKET-008: 希望データ表示機能

## ステータス
📋 未着手

## 優先度
⭐⭐⭐⭐ 高

## 複雑度
Medium

## 概要
取り込んだ希望データの一覧表示

## 成果物
- [ ] `/app/requests/page.tsx` - 希望データ一覧ページ
- [ ] `/lib/actions/shift-requests.ts` - Server Actions（拡張）
- [ ] `/components/requests/` - 関連コンポーネント
  - `RequestsCalendar.tsx` - カレンダー形式表示
  - `RequestsTable.tsx` - テーブル形式表示
  - `RequestsFilter.tsx` - フィルタ

## 依存関係
- TICKET-002: データベーススキーマ構築
- TICKET-007: Excel希望表取り込み機能

## 機能要件

### 表示形式の切り替え
- カレンダー形式
- テーブル形式

### フィルタリング機能
- 年月選択（YYYY-MM形式）
- スタッフ選択（複数選択可）
- 希望タイプ選択（◯/休/早朝/早番/遅番/夜勤）

### カレンダー形式表示
- 月次カレンダー
- 各日付にスタッフ別の希望を表示
- 色分け
  - ◯: 緑
  - 休: グレー
  - 早朝: 黄
  - 早番: オレンジ
  - 遅番: 青
  - 夜勤: 紫

### テーブル形式表示
- スタッフ名（行）× 日付（列）のマトリックス
- セルに希望タイプを表示
- ページネーション

### データ表示
- スタッフ名
- 日付
- 希望タイプ
- 備考（あれば）

## UI設計

### 一覧画面
```
+--------------------------------------------------+
| 希望データ一覧                                     |
+--------------------------------------------------+
| 年月: [2025-12 ▼]  スタッフ: [全員 ▼]             |
| 表示: [⚫カレンダー] [○テーブル]                   |
+--------------------------------------------------+
| 2025年12月                                        |
+--------------------------------------------------+
| 日 | 月 | 火 | 水 | 木 | 金 | 土 |
+--------------------------------------------------+
| 1  | 2  | 3  | 4  | 5  | 6  | 7  |
| 山田◯ | 山田休 | 山田早朝 | ...                   |
| 佐藤早番 | 佐藤◯ | 佐藤◯ | ...                     |
+--------------------------------------------------+
```

### テーブル形式
```
+--------------------------------------------------+
| スタッフ | 12/1 | 12/2 | 12/3 | ... | 12/31 |
+--------------------------------------------------+
| 山田太郎 | ◯   | 休   | 早朝 | ... | ◯     |
| 佐藤花子 | 早番 | ◯   | 休   | ... | 遅番  |
+--------------------------------------------------+
```

## Server Actions実装例

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

export async function getShiftRequests(filters: {
  yearMonth: string
  staffIds?: string[]
  requestTypes?: string[]
}) {
  const supabase = await createClient()

  let query = supabase
    .from('shift_requests')
    .select(`
      *,
      staff (
        id,
        employee_number,
        name
      )
    `)
    .eq('year_month', filters.yearMonth)
    .order('date')
    .order('staff_id')

  if (filters.staffIds && filters.staffIds.length > 0) {
    query = query.in('staff_id', filters.staffIds)
  }

  if (filters.requestTypes && filters.requestTypes.length > 0) {
    query = query.in('request_type', filters.requestTypes)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function getRequestsCalendarData(yearMonth: string) {
  const requests = await getShiftRequests({ yearMonth })

  // カレンダー表示用にデータを整形
  const calendarData: Record<string, Array<{
    staffName: string
    requestType: string
  }>> = {}

  requests.forEach((req) => {
    if (!calendarData[req.date]) {
      calendarData[req.date] = []
    }
    calendarData[req.date].push({
      staffName: req.staff.name,
      requestType: req.request_type,
    })
  })

  return calendarData
}

export async function getRequestsTableData(yearMonth: string) {
  const requests = await getShiftRequests({ yearMonth })

  // テーブル表示用にデータを整形（スタッフ×日付のマトリックス）
  const tableData: Record<string, Record<string, string>> = {}

  requests.forEach((req) => {
    const staffName = req.staff.name
    if (!tableData[staffName]) {
      tableData[staffName] = {}
    }
    tableData[staffName][req.date] = req.request_type
  })

  return tableData
}
```

## カラー設定

```typescript
const REQUEST_TYPE_COLORS = {
  '◯': 'bg-green-100 text-green-800',
  '休': 'bg-gray-100 text-gray-800',
  '早朝': 'bg-yellow-100 text-yellow-800',
  '早番': 'bg-orange-100 text-orange-800',
  '遅番': 'bg-blue-100 text-blue-800',
  '夜勤': 'bg-purple-100 text-purple-800',
}
```

## バリデーション
- 年月形式: YYYY-MM
- 存在する年月のみ選択可能

## テスト項目
- [ ] 希望データ一覧が表示される
- [ ] 年月フィルタが機能する
- [ ] スタッフフィルタが機能する
- [ ] カレンダー形式で表示される
- [ ] テーブル形式で表示される
- [ ] 表示形式の切り替えができる
- [ ] 色分けが正しい
- [ ] データがない場合の表示が適切

## 完了条件
- [ ] カレンダー形式の表示が正しい
- [ ] テーブル形式の表示が正しい
- [ ] フィルタリングが正しく機能する
- [ ] UI/UXが直感的

## 見積もり工数
6-8時間

## 開始予定日
2025-11-20

## 完了予定日
2025-11-21
