# TICKET-020: 給与計算・103万円の壁管理機能

## 概要
バイト・パート従業員（約150人）の給与計算と年間累計給与の管理機能。
103万円の壁を意識した勤務時間・給与の可視化と警告機能を実装。

## 背景
- スタッフの大半がバイト・パートで働いている
- 扶養控除（103万円の壁）を超えないように管理する必要がある
- 時給は全員固定：
  - **通常時給**: 1800円
  - **夜勤時給**: 2250円（22:00～翌5:00）
  - 夜勤は時給が1.25倍

## 機能要件

### 1. 給与計算機能

#### 1.1 勤務時間の計算
- シフトから自動的に勤務時間を計算
- 勤務記号（duty_code）の開始時刻・終了時刻から実働時間を算出
- 夜勤時間（22:00～翌5:00）を自動判定

#### 1.2 給与計算ロジック
```
基本計算式:
- 通常時間の給与 = 通常勤務時間 × 1800円
- 夜勤時間の給与 = 夜勤勤務時間 × 2250円
- 月次給与 = 通常時間の給与 + 夜勤時間の給与

例:
早番（8:00-17:00、9時間）
→ 通常時間: 9時間 × 1800円 = 16,200円

夜勤（22:00-翌7:00、9時間）
→ 夜勤時間（22:00-5:00、7時間）: 7時間 × 2250円 = 15,750円
→ 通常時間（5:00-7:00、2時間）: 2時間 × 1800円 = 3,600円
→ 合計: 19,350円
```

### 2. 年間累計給与管理

#### 2.1 累計給与の追跡
- 1月～12月の年間累計給与を計算
- 月次給与の累積表示
- 残り稼働可能金額の表示

#### 2.2 103万円の壁の可視化
```
警告レベル:
- 緑ゾーン: 0～85万円（安全）
- 黄色ゾーン: 85万円～95万円（注意）
- オレンジゾーン: 95万円～103万円（警告）
- 赤ゾーン: 103万円以上（超過）

表示例:
年間累計: 87.5万円 / 103万円
残り: 15.5万円
ステータス: ⚠️ 注意（85万円超過）
```

#### 2.3 月次上限アラート
- 残り月数から逆算した月次上限金額を計算
- 月次シフト作成時に上限を超えそうな場合に警告

```
計算式:
月次上限 = (103万円 - 累計給与) / 残り月数

例（9月時点で累計75万円の場合）:
月次上限 = (103万円 - 75万円) / 4ヶ月 = 7万円/月
→ 「今月は7万円以内に抑えてください」と表示
```

### 3. UI/UX設計

#### 3.1 スタッフ一覧画面の拡張
- 年間累計給与の表示
- 103万円の壁までの残額表示
- ステータスインジケーター（色分け）

```
スタッフ一覧テーブル:
| 名前 | 社員番号 | 年間累計給与 | 残額 | ステータス | 今月給与 |
|------|----------|--------------|------|------------|----------|
| 山田太郎 | A001 | 87.5万円 | 15.5万円 | ⚠️ 注意 | 7.2万円 |
| 佐藤花子 | A002 | 65.0万円 | 38.0万円 | ✅ 安全 | 5.5万円 |
```

#### 3.2 給与サマリーダッシュボード
新しいページ `/payroll` を作成

**表示内容:**
1. **全体サマリー**
   - 今月の総人件費
   - 先月比較
   - 103万円超過リスクのあるスタッフ数

2. **スタッフ別詳細**
   - 年間累計給与のグラフ（月次推移）
   - 今月の勤務予定・確定給与
   - 残り稼働可能時間

3. **フィルター機能**
   - ステータス別（安全/注意/警告/超過）
   - 役職別
   - 月別

#### 3.3 シフト作成画面の拡張
- スタッフドラッグ時に当月給与を表示
- シフト追加時に103万円超過警告
- 月次給与プレビュー機能

```
シフト追加時の警告例:
⚠️ 警告
このシフトを追加すると、山田太郎さんの今月給与が7.5万円になります。
年間累計: 87.5万円 → 95万円
推奨月次上限: 7万円を超えています。
```

### 4. データ設計

#### 4.1 新テーブル: payroll_records
```sql
CREATE TABLE payroll_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES staff(id) NOT NULL,
  year_month TEXT NOT NULL, -- 'YYYY-MM'
  
  -- 勤務時間
  total_hours DECIMAL(5, 2) NOT NULL, -- 総勤務時間
  regular_hours DECIMAL(5, 2) NOT NULL, -- 通常勤務時間
  night_hours DECIMAL(5, 2) NOT NULL, -- 夜勤時間（22:00-5:00）
  
  -- 給与
  regular_pay INTEGER NOT NULL, -- 通常時給分
  night_pay INTEGER NOT NULL, -- 夜勤時給分
  total_pay INTEGER NOT NULL, -- 月次総給与
  
  -- メタデータ
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'confirmed'
  calculated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(staff_id, year_month)
);

CREATE INDEX idx_payroll_staff_year ON payroll_records(staff_id, year_month);
CREATE INDEX idx_payroll_status ON payroll_records(status);
```

#### 4.2 新テーブル: annual_payroll_summary
```sql
CREATE TABLE annual_payroll_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES staff(id) NOT NULL,
  year INTEGER NOT NULL, -- 2025, 2026, etc.
  
  -- 年間累計
  total_hours DECIMAL(6, 2) NOT NULL, -- 年間総勤務時間
  total_pay INTEGER NOT NULL, -- 年間総給与
  
  -- 103万円の壁関連
  limit_amount INTEGER DEFAULT 1030000, -- 上限金額（デフォルト103万円）
  remaining_amount INTEGER NOT NULL, -- 残額
  warning_level TEXT NOT NULL, -- 'safe' | 'caution' | 'warning' | 'exceeded'
  
  -- メタデータ
  last_calculated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(staff_id, year)
);

CREATE INDEX idx_annual_payroll_staff ON annual_payroll_summary(staff_id, year);
```

### 5. 実装フェーズ

#### Phase 1: バックエンド・給与計算ロジック
- [ ] `lib/payroll/calculator.ts` - 給与計算ロジック
  - `calculateShiftPay()` - 単一シフトの給与計算
  - `calculateMonthlyPay()` - 月次給与集計
  - `calculateAnnualPay()` - 年間給与集計
  - `calculateNightHours()` - 夜勤時間の計算
  - `getWarningLevel()` - 警告レベルの判定

- [ ] `lib/actions/payroll.ts` - Server Actions
  - `getPayrollRecords()` - 給与記録取得
  - `calculateMonthlyPayroll()` - 月次給与計算実行
  - `getAnnualSummary()` - 年間サマリー取得
  - `getStaffPayrollStatus()` - スタッフ給与状況取得

#### Phase 2: データベース・マイグレーション
- [ ] テーブル作成マイグレーション
- [ ] 既存シフトデータから給与計算を実行
- [ ] 自動集計バッチ処理

#### Phase 3: UI実装
- [ ] `/payroll` ページ作成
  - `app/payroll/page.tsx`
  - `components/payroll/PayrollDashboard.tsx`
  - `components/payroll/StaffPayrollTable.tsx`
  - `components/payroll/AnnualChart.tsx`

- [ ] スタッフ一覧の拡張
  - `components/staff/StaffPayrollBadge.tsx` - 給与ステータス表示
  - スタッフ一覧テーブルに年間累計カラム追加

- [ ] シフト作成画面の拡張
  - `components/shifts/PayrollWarning.tsx` - 給与警告表示
  - ドラッグ中のスタッフ情報に当月給与を表示

#### Phase 4: レポート・エクスポート
- [ ] 月次給与レポートPDF出力
- [ ] 年間給与推移グラフ
- [ ] CSV/Excelエクスポート

## 技術仕様

### 夜勤時間の判定アルゴリズム
```typescript
interface TimeRange {
  start: string // 'HH:mm'
  end: string // 'HH:mm'
}

/**
 * 夜勤時間（22:00～翌5:00）を計算
 */
function calculateNightHours(shift: TimeRange): {
  regularHours: number
  nightHours: number
} {
  const NIGHT_START = 22 // 22:00
  const NIGHT_END = 5 // 翌5:00
  
  const startHour = parseTime(shift.start)
  const endHour = parseTime(shift.end)
  
  // 終了時刻が開始時刻より小さい場合は翌日
  let adjustedEnd = endHour
  if (endHour <= startHour) {
    adjustedEnd += 24
  }
  
  let nightHours = 0
  
  // ケース1: 22:00～翌5:00の範囲に完全に含まれる
  if (startHour >= NIGHT_START || adjustedEnd <= NIGHT_END) {
    nightHours = adjustedEnd - startHour
  }
  // ケース2: 22:00をまたぐ
  else if (startHour < NIGHT_START && adjustedEnd > NIGHT_START) {
    const nightEnd = Math.min(adjustedEnd, NIGHT_END + 24)
    nightHours = nightEnd - NIGHT_START
  }
  // ケース3: 翌5:00をまたぐ
  else if (startHour < NIGHT_END && adjustedEnd > NIGHT_END) {
    nightHours = NIGHT_END - startHour
  }
  
  const totalHours = adjustedEnd - startHour
  const regularHours = totalHours - nightHours
  
  return { regularHours, nightHours }
}
```

### 給与計算ロジック
```typescript
const HOURLY_RATE = 1800 // 通常時給
const NIGHT_RATE = 2250 // 夜勤時給

interface PayCalculation {
  regularHours: number
  nightHours: number
  totalHours: number
  regularPay: number
  nightPay: number
  totalPay: number
}

function calculatePay(shift: Shift, dutyCode: DutyCode): PayCalculation {
  const { regularHours, nightHours } = calculateNightHours({
    start: dutyCode.start_time,
    end: dutyCode.end_time,
  })
  
  const totalHours = regularHours + nightHours
  const regularPay = Math.floor(regularHours * HOURLY_RATE)
  const nightPay = Math.floor(nightHours * NIGHT_RATE)
  const totalPay = regularPay + nightPay
  
  return {
    regularHours,
    nightHours,
    totalHours,
    regularPay,
    nightPay,
    totalPay,
  }
}
```

## テストケース

### 夜勤時間計算のテスト
```typescript
test('22:00-翌7:00のシフト', () => {
  const result = calculateNightHours({ start: '22:00', end: '07:00' })
  expect(result.nightHours).toBe(7) // 22:00-5:00
  expect(result.regularHours).toBe(2) // 5:00-7:00
})

test('20:00-翌1:00のシフト', () => {
  const result = calculateNightHours({ start: '20:00', end: '01:00' })
  expect(result.nightHours).toBe(3) // 22:00-1:00
  expect(result.regularHours).toBe(2) // 20:00-22:00
})

test('6:00-15:00の日勤', () => {
  const result = calculateNightHours({ start: '06:00', end: '15:00' })
  expect(result.nightHours).toBe(0)
  expect(result.regularHours).toBe(9)
})
```

### 103万円の壁テスト
```typescript
test('85万円超過で注意レベル', () => {
  const level = getWarningLevel(850000)
  expect(level).toBe('caution')
})

test('95万円超過で警告レベル', () => {
  const level = getWarningLevel(950000)
  expect(level).toBe('warning')
})

test('103万円超過で超過レベル', () => {
  const level = getWarningLevel(1030001)
  expect(level).toBe('exceeded')
})
```

## UI モックアップ

### 給与ダッシュボード
```
┌─────────────────────────────────────────────────────────────┐
│ 給与管理 - 2025年11月                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 📊 全体サマリー                                              │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│ │ 今月総人件費 │ │ 103万円超過  │ │ 警告スタッフ │         │
│ │   125.5万円  │ │  リスク 3人  │ │     8人      │         │
│ └──────────────┘ └──────────────┘ └──────────────┘         │
│                                                              │
│ フィルター: [全て ▼] [安全 ▼] [注意 ▼] [警告 ▼]            │
│                                                              │
│ 👥 スタッフ別給与状況                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │名前     年間累計    残額    ステータス  今月  今月予定│ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │山田太郎  87.5万円  15.5万円  ⚠️ 注意   7.2万円  8.5万円│ │
│ │佐藤花子  65.0万円  38.0万円  ✅ 安全   5.5万円  6.0万円│ │
│ │鈴木一郎  98.5万円   4.5万円  🔴 警告   4.2万円  5.0万円│ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 優先度
**高**: バイト・パート管理の核心機能

## 完了条件
- [ ] 給与計算ロジックが正確に動作
- [ ] 年間累計給与が正しく追跡される
- [ ] 103万円の壁の警告が適切に表示される
- [ ] シフト作成時に給与警告が表示される
- [ ] 給与ダッシュボードが実装される
- [ ] レポート出力が可能
