# TICKET-027: E2Eテスト（クリティカルパス）

## 担当
Infra

## 背景
- ユニットテスト142件はあるがE2Eテストがない
- 提供前に主要フローが動作することを自動検証したい
- Playwright導入でブラウザテスト

## 要件

### 1. Playwright導入
- `@playwright/test`インストール
- playwright.config.ts作成
- テスト用のbaseURL設定（localhost:3000）

### 2. クリティカルパスのE2Eテスト
以下のフローをテスト:

#### a. ログインフロー
- /login表示
- Email/Password入力
- ログイン成功 → ダッシュボードにリダイレクト
- ログイン失敗 → エラーメッセージ表示

#### b. スタッフ管理
- スタッフ一覧表示
- 新規登録フォーム表示
- （実際のDB操作はモック or テスト用Supabaseが必要なのでスキップ可）

#### c. シフト画面表示
- /shiftsアクセス
- カレンダー/テーブル表示確認

### 3. CI統合
- GitHub ActionsにPlaywrightステップ追加（オプショナル）
- ただしSupabase接続が必要なためCIでの実行は将来課題
- ローカル実行用のnpmスクリプト追加: `npm run test:e2e`

## 注意事項
- Supabase接続が必要なテストはスキップ可（CI環境にDBなし）
- ページ表示確認（200レスポンス、主要要素の存在確認）レベルでOK
- 認証が必要なページは/loginリダイレクト確認でOK

## 完了条件
- [ ] Playwright導入済み
- [ ] ログインページの表示テストがパス
- [ ] 認証必要ページのリダイレクトテストがパス
- [ ] `npm run test:e2e`で実行可能
- [ ] `npm run build`が成功
- [ ] PRを作成してURL報告
