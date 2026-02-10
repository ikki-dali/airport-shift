# TICKET-054/055: シードデータ修正 + シフトコード更新

## 担当
Backend

## 背景
- TodayTab/MonthTabで15/43の大きな不足が表示される
- 原因: fillRate計算で28スロット中13個が0人になっている
- シフトコードも実際のExcelデータに合わせる必要あり

---

## TICKET-054: fillRate修正

### 対象ファイル
`lib/seed/demo-data.ts` 255行目付近

### 修正内容
```typescript
// Before
const actualCount = Math.floor(req.required_staff_count * fillRate);

// After
const actualCount = Math.max(1, Math.floor(req.required_staff_count * fillRate));
```

これで28スロット全てに最低1人配置される。

---

## TICKET-055: シフトコードを実データに更新

### 対象ファイル
`lib/seed/demo-data.ts` のduty_codes upsert部分

### 新しいシフトコード一覧
```typescript
// 深夜・早朝
{ code: '22A9GY', name: '深夜', start_time: '22:00', end_time: '07:00', color: '#6366F1' },
{ code: '03G6AA', name: '早朝3時', start_time: '03:00', end_time: '09:00', color: '#8B5CF6' },
{ code: '04J5JA', name: '早朝4時', start_time: '04:00', end_time: '09:45', color: '#A855F7' },

// 早番
{ code: '06A6AA', name: '早番6時', start_time: '06:00', end_time: '12:00', color: '#22C55E' },
{ code: '06J0AW', name: '早番ロング', start_time: '06:00', end_time: '14:00', color: '#16A34A' },

// 日勤
{ code: '09G5AA', name: '日勤9時', start_time: '09:00', end_time: '14:00', color: '#3B82F6' },
{ code: '10A5AA', name: '日勤10時', start_time: '10:00', end_time: '15:00', color: '#2563EB' },
{ code: '11A5AA', name: '日勤11時', start_time: '11:00', end_time: '16:15', color: '#1D4ED8' },

// 遅番
{ code: '14G5AA', name: '遅番14時', start_time: '14:00', end_time: '19:00', color: '#F59E0B' },
{ code: '16A6AA', name: '遅番16時', start_time: '16:00', end_time: '22:00', color: '#D97706' },
{ code: '18A5AA', name: '夕方18時', start_time: '18:00', end_time: '23:00', color: '#B45309' },
{ code: '19A4AA', name: '夜間19時', start_time: '19:00', end_time: '23:00', color: '#92400E' },
```

### 注意
- 既存の4コード（早番/日勤A/日勤B/遅番）を上記12コードに置き換え
- location_requirementsも新しいコードに対応させる必要あり
- 28スロット維持: 7配置 × 4コード → 新コードで再構成

---

## 完了条件
- [ ] fillRate修正でactualCountが最低1人保証
- [ ] シフトコードが12種類に更新
- [ ] location_requirementsが新コードに対応
- [ ] `/admin/seed`でリセット後、不足が3-5人程度に改善
- [ ] TodayTabでシフトコードが正しく表示
- [ ] PRを作成

## 検証
```bash
# ビルド確認
npm run build

# ローカルで確認
# 1. /admin/seed でデモデータリセット
# 2. MonthTabで不足日確認（38-40/43が期待値）
# 3. TodayTabでシフトコード確認
```
