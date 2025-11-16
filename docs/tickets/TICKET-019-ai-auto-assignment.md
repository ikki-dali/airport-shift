# TICKET-019: AI自動シフト割り当て機能

## ステータス
🚧 進行中

## 優先度
⭐⭐⭐⭐⭐ 最高

## 複雑度
High

## 概要
シフト希望データと配属箇所要件から、AIが最適なシフト配置を自動生成する機能

## ビジネス価値
- シフト作成時間を大幅に削減（手動: 数時間 → 自動: 数秒）
- 人的エラーの削減
- 公平なシフト配置の実現
- スタッフの希望を最大限考慮

## 成果物
- [ ] `/lib/ai/shift-optimizer.ts` - シフト最適化アルゴリズム
- [ ] `/lib/ai/constraint-solver.ts` - 制約充足ソルバー
- [ ] `/lib/actions/auto-assign.ts` - 自動割り当てアクション
- [ ] `/components/shifts/AutoAssignButton.tsx` - 自動割り当てボタン
- [ ] `/components/shifts/AssignmentPreview.tsx` - プレビュー画面
- [ ] 単体テスト

## 依存関係
- TICKET-008: 希望データ表示機能
- TICKET-009: シフト作成UI
- TICKET-011: 制約チェック機能

---

## 機能要件

### 1. インプット

#### 1.1 シフト希望データ
```typescript
interface ShiftRequest {
  staff_id: string
  date: string
  request_type: '◯' | '休' | '早朝' | '早番' | '遅番' | '夜勤'
  note: string | null
}
```

#### 1.2 スタッフ情報
```typescript
interface Staff {
  id: string
  name: string
  role_id: string
  tags: string[]
  is_responsible: boolean
}
```

#### 1.3 配属箇所要件
```typescript
interface LocationRequirement {
  location_id: string
  duty_code_id: string
  required_staff_count: number
  required_responsible_count: number
  required_tags: string[]
  day_of_week?: number | null
}
```

#### 1.4 既存シフト（オプション）
- 既に配置済みのシフトは固定として扱う

### 2. 最適化目標

#### 2.1 必須制約（Hard Constraints）
1. **必要人数の充足**
   - 各配属箇所・勤務記号の必要人数を満たす
   
2. **責任者の配置**
   - 必要責任者数を満たす
   
3. **必要タグの確保**
   - 各配属箇所の必要タグを持つスタッフを配置
   
4. **重複配置の禁止**
   - 同じスタッフを同日に複数配置しない
   
5. **スタッフの利用可能性**
   - 休希望の日は配置しない（強い制約）

#### 2.2 推奨制約（Soft Constraints）- 優先度順
1. **◯希望の最大化** (優先度: 高)
   - ◯(勤務希望)の日に配置
   - スコア: +10点
   
2. **休希望の尊重** (優先度: 高)
   - 休希望の日は避ける
   - ペナルティ: -20点
   
3. **早番/遅番希望の考慮** (優先度: 中)
   - 希望する勤務記号に配置
   - スコア: +5点
   
4. **夜勤明けの回避** (優先度: 中)
   - 夜勤翌日は配置しない
   - ペナルティ: -10点
   
5. **連続勤務制限** (優先度: 中)
   - 6日以上の連続勤務を避ける
   - ペナルティ: -15点
   
6. **勤務日数の均等化** (優先度: 低)
   - 月間勤務日数の差を最小化
   - スコア: 標準偏差に応じて計算
   
7. **希望充足率の公平性** (優先度: 低)
   - 全スタッフの希望充足率を均等化

### 3. アルゴリズム

#### 3.1 アプローチ
**制約充足問題（CSP）+ 貪欲法 + 局所探索**

```
1. 初期解の生成（貪欲法）
   - 必須制約を満たす初期配置を作成
   - 希望の強いスタッフから優先的に配置

2. 局所探索による改善
   - シミュレーテッドアニーリング or タブーサーチ
   - スワップ操作でスコアを改善

3. 制約違反の修正
   - 必須制約違反があれば修正
```

#### 3.2 擬似コード

```typescript
function autoAssignShifts(
  yearMonth: string,
  locationRequirements: LocationRequirement[],
  staff: Staff[],
  shiftRequests: ShiftRequest[],
  existingShifts?: Shift[]
): AssignmentResult {
  // 1. データ準備
  const dates = getDatesInMonth(yearMonth)
  const assignments: Shift[] = [...(existingShifts || [])]
  
  // 2. 各日付・配属箇所・勤務記号ごとに処理
  for (const date of dates) {
    for (const req of getRequirementsForDate(locationRequirements, date)) {
      // 2.1 候補スタッフをスコアリング
      const candidates = scoreStaff(staff, shiftRequests, date, req, assignments)
      
      // 2.2 必須制約を満たすように選択
      const selected = selectStaff(
        candidates,
        req.required_staff_count,
        req.required_responsible_count,
        req.required_tags
      )
      
      // 2.3 シフトに追加
      assignments.push(...selected.map(s => createShift(s, date, req)))
    }
  }
  
  // 3. 局所探索で改善
  const optimized = localSearch(assignments, shiftRequests, locationRequirements)
  
  // 4. 結果を返す
  return {
    assignments: optimized,
    score: calculateScore(optimized, shiftRequests),
    violations: validateAll(optimized, locationRequirements),
    stats: calculateStats(optimized, shiftRequests, staff)
  }
}
```

### 4. スコアリング関数

```typescript
function scoreStaff(
  staff: Staff,
  date: string,
  dutyCode: DutyCode,
  shiftRequests: ShiftRequest[],
  assignments: Shift[]
): number {
  let score = 0
  
  const request = shiftRequests.find(r => r.staff_id === staff.id && r.date === date)
  
  // 希望タイプによるスコア
  if (request) {
    if (request.request_type === '◯') score += 10
    if (request.request_type === '休') score -= 20
    if (matchesDutyCode(request.request_type, dutyCode)) score += 5
  }
  
  // 夜勤明けチェック
  const prevShift = getPreviousDayShift(staff.id, date, assignments)
  if (prevShift && isNightShift(prevShift)) score -= 10
  
  // 連続勤務チェック
  const consecutiveDays = getConsecutiveWorkDays(staff.id, date, assignments)
  if (consecutiveDays >= 6) score -= 15
  
  return score
}
```

### 5. UI設計

#### 5.1 自動割り当てボタン
```typescript
// components/shifts/AutoAssignButton.tsx
<Button onClick={handleAutoAssign}>
  <Sparkles className="h-4 w-4 mr-2" />
  AI自動割り当て
</Button>
```

#### 5.2 プレビュー画面
```typescript
// components/shifts/AssignmentPreview.tsx
<Dialog>
  <DialogContent>
    <h2>自動割り当て結果プレビュー</h2>
    
    {/* 統計情報 */}
    <div>
      <p>割り当て総数: {result.assignments.length}件</p>
      <p>希望充足率: {result.stats.fulfillmentRate}%</p>
      <p>制約違反: {result.violations.length}件</p>
    </div>
    
    {/* カレンダー表示 */}
    <ShiftCalendar shifts={result.assignments} />
    
    {/* アクション */}
    <div>
      <Button onClick={applyAssignments}>適用</Button>
      <Button onClick={cancel}>キャンセル</Button>
    </div>
  </DialogContent>
</Dialog>
```

### 6. API設計

#### 6.1 自動割り当てAPI
```typescript
// app/api/shifts/auto-assign/route.ts
export async function POST(request: Request) {
  const { yearMonth, clearExisting } = await request.json()
  
  // データ取得
  const [requirements, staff, requests, existingShifts] = await Promise.all([
    getLocationRequirements(),
    getStaff(),
    getShiftRequests(yearMonth),
    clearExisting ? [] : getShifts(yearMonth)
  ])
  
  // 自動割り当て実行
  const result = await autoAssignShifts(
    yearMonth,
    requirements,
    staff,
    requests,
    existingShifts
  )
  
  return NextResponse.json(result)
}
```

---

## 実装ステップ

### Phase 1: コアアルゴリズム
- [ ] `lib/ai/shift-optimizer.ts` - 基本的な最適化ロジック
- [ ] `lib/ai/constraint-solver.ts` - 制約充足ソルバー
- [ ] `lib/ai/scoring.ts` - スコアリング関数
- [ ] 単体テスト

### Phase 2: バックエンド統合
- [ ] `lib/actions/auto-assign.ts` - Server Actions
- [ ] `/api/shifts/auto-assign/route.ts` - APIエンドポイント
- [ ] 統合テスト

### Phase 3: UI実装
- [ ] `AutoAssignButton.tsx` - ボタンコンポーネント
- [ ] `AssignmentPreview.tsx` - プレビュー画面
- [ ] シフト作成画面への統合

### Phase 4: 改善・最適化
- [ ] パフォーマンスチューニング
- [ ] エラーハンドリング強化
- [ ] ユーザーフィードバック対応

---

## テストケース

### 1. 基本動作
- [ ] 必要人数を満たすシフトが生成される
- [ ] 責任者が適切に配置される
- [ ] 必要タグが満たされる

### 2. 希望の考慮
- [ ] ◯希望の日に優先的に配置される
- [ ] 休希望の日は避けられる
- [ ] 早番/遅番希望が考慮される

### 3. 制約の遵守
- [ ] 夜勤明けに配置されない
- [ ] 連続勤務が6日を超えない
- [ ] 同日重複配置がない

### 4. 公平性
- [ ] 勤務日数が均等化される
- [ ] 希望充足率が公平

### 5. エッジケース
- [ ] スタッフ不足時の処理
- [ ] 全員が休希望の日の処理
- [ ] 既存シフトとの競合

---

## パフォーマンス目標
- **実行時間**: 1ヶ月分（30日 × 5箇所 × 平均3勤務記号）を10秒以内
- **メモリ使用量**: 100MB以内
- **同時実行**: 複数ユーザーの並列実行に対応

---

## 将来の拡張

### v2: 機械学習の導入
- 過去のシフトパターンから学習
- より人間らしい判断の実現

### v3: マルチ目的最適化
- 複数の目標関数を同時に最適化
- パレート最適解の提示

### v4: インタラクティブ最適化
- ユーザーが制約の優先度を調整
- リアルタイムプレビュー

---

## 完了条件
- [ ] 自動割り当てが正常に動作する
- [ ] 必須制約が100%満たされる
- [ ] 希望充足率が70%以上
- [ ] 制約違反が最小化される
- [ ] UIが直感的で使いやすい
- [ ] パフォーマンスが目標値を満たす
- [ ] 全テストケースが通過する

## 見積もり工数
12-16時間

## 開始日
2025-11-16

## 目標完了日
2025-11-17
