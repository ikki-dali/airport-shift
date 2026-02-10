# TICKET-056: 不足日のリアル感向上

## 担当
Backend

## 問題
- 不足日が全部28/43（-15）で固定
- 機械的で違和感がある
- `Math.max(1, ...)`で28スロット全てに1人配置 → 28人固定

## 要件
不足日でもバリエーションを出す：
- 28-38人の幅を持たせる
- 日によって異なる不足パターン

## 修正方針
`lib/seed/demo-data.ts` のfillRate周り

### 案1: スロットごとにランダム性追加
```typescript
// 各スロットで配置確率を変える
const skipProbability = fillRate < 1.0 ? 0.3 : 0; // 不足日は30%の確率でスキップ
if (Math.random() < skipProbability) continue;

// 最低1人保証を外す
const actualCount = Math.floor(req.required_staff_count * fillRate);
```

### 案2: fillRateにノイズ追加
```typescript
// 日単位ではなくスロット単位でfillRateを変動
const slotFillRate = fillRate * (0.8 + Math.random() * 0.4); // ±20%の変動
const actualCount = Math.floor(req.required_staff_count * slotFillRate);
```

### 期待結果
| 日 | 現状 | 改善後 |
|---|------|--------|
| 5日 | 28/43 | 32-38/43 |
| 7日 | 28/43 | 30-36/43 |
| 10日 | 28/43 | 33-39/43 |

- 不足パターンにばらつき
- -5〜-15の範囲で自然な変動

## 完了条件
- [ ] 不足日が28人固定ではなく、28-38人の範囲で変動
- [ ] カレンダー表示で自然なばらつきが確認できる
- [ ] PRを作成
