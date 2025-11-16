-- 給与記録テーブル（月次）
CREATE TABLE payroll_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
  year_month TEXT NOT NULL, -- 'YYYY-MM'
  
  -- 勤務時間
  total_hours DECIMAL(5, 2) NOT NULL DEFAULT 0, -- 総勤務時間
  regular_hours DECIMAL(5, 2) NOT NULL DEFAULT 0, -- 通常勤務時間
  night_hours DECIMAL(5, 2) NOT NULL DEFAULT 0, -- 夜勤時間（22:00-5:00）
  
  -- 給与
  regular_pay INTEGER NOT NULL DEFAULT 0, -- 通常時給分
  night_pay INTEGER NOT NULL DEFAULT 0, -- 夜勤時給分
  total_pay INTEGER NOT NULL DEFAULT 0, -- 月次総給与
  
  -- シフト数
  shift_count INTEGER NOT NULL DEFAULT 0,
  
  -- メタデータ
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'confirmed'
  calculated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(staff_id, year_month)
);

-- 年間給与サマリーテーブル
CREATE TABLE annual_payroll_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL, -- 2025, 2026, etc.
  
  -- 年間累計
  total_hours DECIMAL(6, 2) NOT NULL DEFAULT 0, -- 年間総勤務時間
  total_pay INTEGER NOT NULL DEFAULT 0, -- 年間総給与
  
  -- 給与上限関連（スタッフごとに設定可能）
  limit_amount INTEGER DEFAULT 1030000, -- 上限金額（103万/106万/130万/150万など）
  remaining_amount INTEGER NOT NULL DEFAULT 1030000, -- 残額
  warning_level TEXT NOT NULL DEFAULT 'safe', -- 'safe' | 'caution' | 'warning' | 'exceeded'
  
  -- メタデータ
  last_calculated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(staff_id, year)
);

-- スタッフの給与設定テーブル（目標上限額を管理）
CREATE TABLE staff_payroll_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- 目標上限額（よくある壁の額をプリセット）
  target_limit INTEGER NOT NULL DEFAULT 1030000, -- デフォルト103万円
  limit_type TEXT, -- 'tax_dependent_103' | 'insurance_106' | 'insurance_130' | 'spouse_150' | 'custom'
  
  -- カスタム上限額（任意の金額を設定可能）
  custom_note TEXT, -- 備考（「扶養内で働きたい」など）
  
  -- アラート設定
  warning_threshold_percent INTEGER DEFAULT 85, -- 警告を出す閾値（デフォルト85%）
  caution_threshold_percent INTEGER DEFAULT 75, -- 注意を出す閾値（デフォルト75%）
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_payroll_staff_year ON payroll_records(staff_id, year_month);
CREATE INDEX idx_payroll_status ON payroll_records(status);
CREATE INDEX idx_annual_payroll_staff ON annual_payroll_summary(staff_id, year);
CREATE INDEX idx_annual_payroll_warning ON annual_payroll_summary(warning_level);
CREATE INDEX idx_staff_payroll_settings_staff ON staff_payroll_settings(staff_id);

-- RLS（Row Level Security）ポリシー
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE annual_payroll_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_payroll_settings ENABLE ROW LEVEL SECURITY;

-- 匿名ユーザーでも読み取り可能（開発環境用）
CREATE POLICY "Allow anonymous read access on payroll_records"
  ON payroll_records
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous write access on payroll_records"
  ON payroll_records
  FOR ALL
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous read access on annual_payroll_summary"
  ON annual_payroll_summary
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous write access on annual_payroll_summary"
  ON annual_payroll_summary
  FOR ALL
  TO anon
  USING (true);

-- 認証ユーザーは全てのデータにアクセス可能
CREATE POLICY "Allow authenticated read access on payroll_records"
  ON payroll_records
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated write access on payroll_records"
  ON payroll_records
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access on annual_payroll_summary"
  ON annual_payroll_summary
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated write access on annual_payroll_summary"
  ON annual_payroll_summary
  FOR ALL
  TO authenticated
  USING (true);

-- staff_payroll_settings policies
CREATE POLICY "Allow anonymous read access on staff_payroll_settings"
  ON staff_payroll_settings
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous write access on staff_payroll_settings"
  ON staff_payroll_settings
  FOR ALL
  TO anon
  USING (true);

CREATE POLICY "Allow authenticated read access on staff_payroll_settings"
  ON staff_payroll_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated write access on staff_payroll_settings"
  ON staff_payroll_settings
  FOR ALL
  TO authenticated
  USING (true);

-- 更新時刻を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_payroll_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payroll_records_updated_at
  BEFORE UPDATE ON payroll_records
  FOR EACH ROW
  EXECUTE FUNCTION update_payroll_updated_at();

CREATE TRIGGER update_annual_payroll_summary_updated_at
  BEFORE UPDATE ON annual_payroll_summary
  FOR EACH ROW
  EXECUTE FUNCTION update_payroll_updated_at();

CREATE TRIGGER update_staff_payroll_settings_updated_at
  BEFORE UPDATE ON staff_payroll_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_payroll_updated_at();
