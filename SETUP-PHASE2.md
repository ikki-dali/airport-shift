# フェーズ2セットアップガイド

## 概要
バイト用シフト希望入力サイトを有効にするためのセットアップ手順です。

## 前提条件
- Supabase プロジェクトが作成済み
- `.env.local` に Supabase の接続情報が設定済み

## セットアップ手順

### 1. データベースマイグレーションの実行

Supabase ダッシュボードにログインして、SQL エディタでマイグレーションを実行します。

1. [Supabase Dashboard](https://app.supabase.com/) にログイン
2. 該当プロジェクトを選択
3. 左メニューから「SQL Editor」を選択
4. 「New query」をクリック
5. 以下のSQLを貼り付けて実行:

```sql
-- Add request_token column to staff table for shift request system
-- This token will be used to allow staff to submit shift requests without login

ALTER TABLE staff ADD COLUMN IF NOT EXISTS request_token TEXT UNIQUE;

-- Generate tokens for existing staff (UUID format)
UPDATE staff
SET request_token = gen_random_uuid()::text
WHERE request_token IS NULL;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_staff_request_token ON staff(request_token);

-- Add comment for documentation
COMMENT ON COLUMN staff.request_token IS 'Unique token for staff to access shift request submission page without login';
```

6. 「Run」をクリックして実行

### 2. 環境変数の確認（オプション）

`.env.local` ファイルに以下の環境変数が設定されているか確認してください：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. アプリケーションの起動

```bash
npm run dev
```

### 4. 動作確認

#### 管理者側
1. `http://localhost:3000/staff` にアクセス
2. スタッフ一覧の「シフト希望URL」列に「URLコピー」ボタンが表示されていることを確認
3. ボタンをクリックしてURLをコピー

#### スタッフ側
1. コピーしたURLにアクセス（例: `http://localhost:3000/shift-request/xxxxx-xxxx-xxxx-xxxx-xxxxxxxxx`）
2. スタッフ名が表示されていることを確認
3. 希望を選択して「希望を提出する」ボタンをクリック
4. 「提出完了！」メッセージが表示されることを確認

#### AI自動生成での確認
1. `http://localhost:3000/shifts/create` にアクセス
2. 「希望設定」ボタンをクリック → 提出された希望が表示されることを確認
3. 「AIで自動生成」ボタンをクリック → 希望が考慮されたシフトが生成されることを確認

## トラブルシューティング

### マイグレーション実行時のエラー

**エラー**: `column "request_token" already exists`
- **解決方法**: 既にカラムが追加されています。このエラーは無視して問題ありません。

**エラー**: `permission denied`
- **解決方法**: Supabase のプロジェクト管理者権限でログインしているか確認してください。

### トークンURLにアクセスできない

**症状**: 404 Not Found が表示される
- **原因1**: マイグレーションが実行されていない
  - **解決方法**: 上記の手順1を実行してください
- **原因2**: トークンが無効
  - **解決方法**: スタッフ一覧画面で正しいURLをコピーしてください

### URLコピーボタンが表示されない

**原因**: 型定義が更新されていない
- **解決方法**: `npm run dev` を再起動してください

## セキュリティに関する注意事項

1. **トークンの取り扱い**
   - トークンURLは推測困難なUUID v4形式です
   - URLを知っている人だけがアクセスできます
   - 必要に応じてトークンを再発行できます

2. **トークンの再発行方法**
   - 将来的に管理者画面から再発行機能を追加予定
   - 現在は SQL エディタで手動実行:
     ```sql
     UPDATE staff
     SET request_token = gen_random_uuid()::text
     WHERE id = 'スタッフのID';
     ```

3. **本番環境での運用**
   - HTTPS を必ず使用してください
   - トークンURLは機密情報として扱ってください
   - 退職したスタッフのトークンは無効化してください

## 次のステップ

フェーズ3では以下の機能を実装予定です：
- Excel インポート機能
- QRコード生成
- トークン再発行UI
- 提出締め切りリマインダー

詳細は `docs/tickets/TICKET-021-shift-request-system.md` を参照してください。
