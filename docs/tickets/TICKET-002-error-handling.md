# TICKET-002: エラーハンドリング統一

## 担当
Backend

## 背景
- lib/actions/shifts.tsはtry-catch有、staff.tsはなし → 不統一
- DBエラーメッセージがユーザーに直接露出
- OpenAI API呼び出しにリトライ・タイムアウトなし
- console.log/errorが91箇所散在

## 要件

### 1. カスタムエラークラス作成
- `lib/errors/index.ts`に以下を作成:
  - `AppError`（基底クラス）
  - `ValidationError`
  - `DatabaseError`
  - `ExternalAPIError`（OpenAI等）
  - `AuthError`（将来用）

### 2. Server Actions全体のtry-catch統一
- `lib/actions/*.ts`の全関数にtry-catch追加
- エラー時は適切なカスタムエラーをthrow
- DBエラーの詳細はログのみ、ユーザーには汎用メッセージ

### 3. OpenAI API呼び出し改善
- `lib/actions/ai-shift-generator.ts`に以下追加:
  - タイムアウト設定（30秒）
  - リトライロジック（最大3回、exponential backoff）
  - レート制限エラーの適切な処理

### 4. console.log整理
- 開発用のconsole.logは削除 or debug用に変更
- エラーログは構造化（最低限エラー内容+コンテキスト情報）

## 完了条件
- [ ] カスタムエラークラスが作成されている
- [ ] lib/actions配下の全関数にtry-catch統一
- [ ] DBエラーメッセージがユーザーに露出しない
- [ ] OpenAI呼び出しにタイムアウト+リトライ実装
- [ ] 不要なconsole.logが削除されている
- [ ] `npm run build`が成功
- [ ] PRを作成してURL報告
