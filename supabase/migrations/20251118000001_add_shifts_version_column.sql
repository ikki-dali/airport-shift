-- 楽観的ロック用versionカラム追加
ALTER TABLE shifts ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN shifts.version IS '楽観的ロック用バージョン番号（更新のたびにインクリメント）';

-- shifts専用トリガー関数（version自動インクリメント + updated_at更新）
CREATE OR REPLACE FUNCTION update_shifts_version_and_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 既存の汎用トリガーを削除し、shifts専用トリガーに置換
DROP TRIGGER IF EXISTS update_shifts_updated_at ON shifts;

CREATE TRIGGER update_shifts_version_and_timestamp
  BEFORE UPDATE ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION update_shifts_version_and_timestamp();
