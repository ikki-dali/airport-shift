-- システム設定テーブルの作成
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 更新時にupdated_atを自動更新するトリガー
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_updated_at();

-- 初期設定値を挿入
INSERT INTO system_settings (key, value, description, category) VALUES
  ('default_required_staff', '43', '1日あたりデフォルト必要人数', 'shift'),
  ('shift_confirm_deadline_days', '7', 'シフト確定期限（何日前）', 'shift'),
  ('emergency_phone_number', '', '緊急連絡先電話番号', 'emergency'),
  ('timeline_start_hour', '0', 'タイムライン開始時間', 'display'),
  ('timeline_end_hour', '24', 'タイムライン終了時間', 'display'),
  ('display_days_count', '10', '表示日数', 'display')
ON CONFLICT (key) DO NOTHING;

-- RLSポリシー（認証済みユーザーのみアクセス可能）
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 読み取りは認証済みユーザーに許可
CREATE POLICY "Allow authenticated users to read settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (true);

-- 更新は認証済みユーザーに許可
CREATE POLICY "Allow authenticated users to update settings"
  ON system_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 挿入は認証済みユーザーに許可
CREATE POLICY "Allow authenticated users to insert settings"
  ON system_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- anonユーザーにも読み取りを許可（シフト表示などで必要な場合）
CREATE POLICY "Allow anon users to read settings"
  ON system_settings FOR SELECT
  TO anon
  USING (true);
