# TICKET-006: テスト基盤構築 + ビジネスロジックテスト作成

## 担当
Infra（QAモード）

## 背景
- 現在テストファイルが0件
- 製品化に向けてリグレッション防止が必須
- まずはビジネスロジック（Server Actions、バリデーション）のユニットテストから

## 要件

### 1. テストフレームワークセットアップ
- Vitest導入（Next.js App Router対応）
- vitest.config.ts作成
- package.jsonにtest/test:watchスクリプト追加
- テスト用のSupabaseモック設定

### 2. ユニットテスト作成（優先度順）

#### 最優先: バリデーション・ビジネスロジック
- `lib/validators/shift-validator.ts` - シフトバリデーション
- `lib/payroll/calculator.ts` - 給与計算ロジック
- `lib/shift-constraints.ts` - シフト制約チェック
- `lib/errors/helpers.ts` - handleSupabaseError

#### 次点: Server Actions（モック使用）
- `lib/actions/shifts.ts` - createShift, updateShift（楽観的ロック含む）
- `lib/actions/staff.ts` - createStaff, deleteStaff

#### その他
- `lib/auth/index.ts` - requireAuth
- `lib/errors/logger.ts` - ロガー出力確認

### 3. テスト方針
- Supabaseはモック（実DBに接続しない）
- カバレッジ目標: ビジネスロジック80%以上
- テストファイル配置: `__tests__/` or 同階層 `.test.ts`

## 完了条件
- [ ] Vitest動作確認（`npm test`で実行可能）
- [ ] shift-validator.tsのテスト: 5ケース以上
- [ ] calculator.tsのテスト: 5ケース以上
- [ ] shift-constraints.tsのテスト: 3ケース以上
- [ ] handleSupabaseErrorのテスト: 全PGコード分岐
- [ ] 全テストがパス
- [ ] PRを作成してURL報告
