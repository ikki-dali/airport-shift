-- スタッフテーブルにExpoプッシュトークンカラムを追加
ALTER TABLE staff ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- インデックスを作成（トークンがあるスタッフを効率的に検索）
CREATE INDEX IF NOT EXISTS idx_staff_expo_push_token ON staff(expo_push_token) WHERE expo_push_token IS NOT NULL;

-- コメントを追加
COMMENT ON COLUMN staff.expo_push_token IS 'Expo Push Notification用のトークン（モバイルアプリから設定）';
