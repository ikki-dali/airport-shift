# TICKET-004: 認証基盤構築（Supabase Auth + RLS + Middleware）

## 担当
Backend

## 背景
- 現在RLSポリシーが全て`USING(true)`で誰でもデータアクセス可能
- middleware.tsが存在せず、全ページ無認証でアクセス可能
- 認証方式: Email/Password（Supabase Auth）

## 要件

### 1. Supabase Auth設定
- `@supabase/ssr`パッケージ導入（もしまだなら）
- `lib/supabase/server.ts`を認証対応に更新
- `lib/supabase/middleware.ts`作成（セッション管理）

### 2. middleware.ts作成
- `/app/middleware.ts`作成
- 認証不要ページ: `/login`, `/staff/shifts/[token]`（既存のトークン確認ページ）
- その他全ページは認証必須
- 未認証時は`/login`にリダイレクト

### 3. RLSポリシー書き直し
- `20251116000001_allow_anon_access.sql`のUSING(true)ポリシーを廃止
- 新規マイグレーションで適切なRLSポリシーを作成:
  - staff: 認証済みユーザーのみ読み書き
  - shifts: 認証済みユーザーのみ読み書き
  - その他テーブル: 同様
- `confirm_shifts` RPC関数のanon権限を削除、authenticated のみに変更

### 4. 認証ヘルパー関数
- `lib/auth/index.ts`: getCurrentUser(), requireAuth()
- Server Actionsの冒頭でrequireAuth()呼び出し（主要アクションのみ）

### 5. 初期管理者ユーザー作成
- seed/README.mdに管理者ユーザー作成手順を記載
- もしくはSupabase Dashboard経由での作成手順

## 注意事項
- トークンベースのスタッフ確認ページ（`/staff/shifts/[token]`）は認証不要のまま維持
- 既存のスタッフデータとauth.usersテーブルは別管理（将来マッピング検討）
- 今回はシンプルな認証のみ。RBAC（管理者/一般）は将来対応

## 完了条件
- [ ] middleware.tsが動作し、未認証時にログインページへリダイレクト
- [ ] RLSポリシーが認証済みユーザーのみ許可に変更
- [ ] confirm_shifts RPCのanon権限削除済み
- [ ] Server Actions（主要5つ以上）でrequireAuth()実装
- [ ] マイグレーションファイル作成済み
- [ ] `npm run build`が成功
- [ ] PRを作成してURL報告
