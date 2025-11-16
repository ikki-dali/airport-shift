-- Initial Schema for Shift Management System
-- Created: 2025-11-15
-- Reference: docs/tickets/TICKET-002-database-schema.md

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. ROLES TABLE (役職マスタ)
-- =====================================================
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  is_responsible BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE roles IS '役職マスタテーブル';
COMMENT ON COLUMN roles.is_responsible IS '責任者になれるか';
COMMENT ON COLUMN roles.priority IS '優先度（数値が大きいほど上位）';

-- =====================================================
-- 2. TAGS TABLE (タグマスタ)
-- =====================================================
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE tags IS 'スキル・資格タグマスタテーブル';

-- =====================================================
-- 3. STAFF TABLE (スタッフ)
-- =====================================================
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE staff IS 'スタッフ情報テーブル';
COMMENT ON COLUMN staff.employee_number IS '社員番号（4桁）';
COMMENT ON COLUMN staff.tags IS '保有タグ（配列）';
COMMENT ON COLUMN staff.is_active IS '在籍中かどうか';

CREATE INDEX idx_staff_employee_number ON staff(employee_number);
CREATE INDEX idx_staff_is_active ON staff(is_active);
CREATE INDEX idx_staff_role_id ON staff(role_id);

-- =====================================================
-- 4. DUTY_CODES TABLE (勤務記号マスタ)
-- =====================================================
CREATE TABLE duty_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  break_minutes INTEGER NOT NULL DEFAULT 0,
  is_overnight BOOLEAN DEFAULT false,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE duty_codes IS '勤務記号マスタテーブル';
COMMENT ON COLUMN duty_codes.code IS '勤務記号（例: 06G5DA）';
COMMENT ON COLUMN duty_codes.category IS 'カテゴリ（T3中央、T3北、T2中央、バス案内、横特）';
COMMENT ON COLUMN duty_codes.is_overnight IS '日またぎフラグ';

CREATE INDEX idx_duty_codes_code ON duty_codes(code);
CREATE INDEX idx_duty_codes_category ON duty_codes(category);

-- =====================================================
-- 5. LOCATIONS TABLE (配属箇所)
-- =====================================================
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_type TEXT NOT NULL,
  location_name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE locations IS '配属箇所マスタテーブル';
COMMENT ON COLUMN locations.business_type IS '業務種別（保安検査場案内業務、バス案内業務、横特業務）';
COMMENT ON COLUMN locations.code IS '略称（T3C、T3N、T2C、BUS、TOU）';

CREATE INDEX idx_locations_code ON locations(code);
CREATE INDEX idx_locations_is_active ON locations(is_active);

-- =====================================================
-- 6. LOCATION_REQUIREMENTS TABLE (配属箇所要件)
-- =====================================================
CREATE TABLE location_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  duty_code_id UUID REFERENCES duty_codes(id) ON DELETE RESTRICT,
  required_staff_count INTEGER NOT NULL CHECK (required_staff_count > 0),
  required_responsible_count INTEGER DEFAULT 0 CHECK (required_responsible_count >= 0),
  required_tags TEXT[] DEFAULT '{}',
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  specific_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT single_pattern CHECK (
    (day_of_week IS NULL AND specific_date IS NULL) OR
    (day_of_week IS NOT NULL AND specific_date IS NULL) OR
    (day_of_week IS NULL AND specific_date IS NOT NULL)
  )
);

COMMENT ON TABLE location_requirements IS '配属箇所要件テーブル';
COMMENT ON COLUMN location_requirements.day_of_week IS '曜日パターン（0=日曜、6=土曜）';
COMMENT ON COLUMN location_requirements.specific_date IS '特定日パターン';
COMMENT ON CONSTRAINT single_pattern ON location_requirements IS 'デフォルト、曜日、特定日のいずれか1つのみ設定可能';

CREATE INDEX idx_location_requirements_location_id ON location_requirements(location_id);
CREATE INDEX idx_location_requirements_duty_code_id ON location_requirements(duty_code_id);
CREATE INDEX idx_location_requirements_day_of_week ON location_requirements(day_of_week);
CREATE INDEX idx_location_requirements_specific_date ON location_requirements(specific_date);

-- =====================================================
-- 7. SHIFT_REQUESTS TABLE (希望提出)
-- =====================================================
CREATE TABLE shift_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('◯', '休', '早朝', '早番', '遅番', '夜勤')),
  note TEXT,
  year_month TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_staff_date UNIQUE (staff_id, date)
);

COMMENT ON TABLE shift_requests IS '希望提出テーブル';
COMMENT ON COLUMN shift_requests.request_type IS '希望タイプ（◯/休/早朝/早番/遅番/夜勤）';
COMMENT ON COLUMN shift_requests.year_month IS '年月（YYYY-MM形式）';

CREATE INDEX idx_shift_requests_staff_id ON shift_requests(staff_id);
CREATE INDEX idx_shift_requests_date ON shift_requests(date);
CREATE INDEX idx_shift_requests_year_month ON shift_requests(year_month);

-- =====================================================
-- 8. SHIFTS TABLE (シフト)
-- =====================================================
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE RESTRICT,
  duty_code_id UUID REFERENCES duty_codes(id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  status TEXT DEFAULT '予定' CHECK (status IN ('予定', '確定', '変更', 'キャンセル')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  CONSTRAINT unique_staff_date_shift UNIQUE (staff_id, date)
);

COMMENT ON TABLE shifts IS 'シフトテーブル';
COMMENT ON COLUMN shifts.status IS 'ステータス（予定/確定/変更/キャンセル）';
COMMENT ON COLUMN shifts.created_by IS '作成者のユーザーID';
COMMENT ON COLUMN shifts.updated_by IS '更新者のユーザーID';

CREATE INDEX idx_shifts_staff_id ON shifts(staff_id);
CREATE INDEX idx_shifts_location_id ON shifts(location_id);
CREATE INDEX idx_shifts_duty_code_id ON shifts(duty_code_id);
CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_shifts_status ON shifts(status);
CREATE INDEX idx_shifts_location_date ON shifts(location_id, date);

-- =====================================================
-- TRIGGERS: updated_at 自動更新
-- =====================================================

-- 自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルにトリガー設定
CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_duty_codes_updated_at
  BEFORE UPDATE ON duty_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_requests_updated_at
  BEFORE UPDATE ON shift_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at
  BEFORE UPDATE ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Policies: 認証済みユーザーは全てのテーブルにアクセス可能（MVP版）
CREATE POLICY "認証済みユーザーはroles閲覧可能" ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "認証済みユーザーはroles追加可能" ON roles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "認証済みユーザーはroles更新可能" ON roles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "認証済みユーザーはroles削除可能" ON roles FOR DELETE TO authenticated USING (true);

CREATE POLICY "認証済みユーザーはtags閲覧可能" ON tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "認証済みユーザーはtags追加可能" ON tags FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "認証済みユーザーはtags更新可能" ON tags FOR UPDATE TO authenticated USING (true);
CREATE POLICY "認証済みユーザーはtags削除可能" ON tags FOR DELETE TO authenticated USING (true);

CREATE POLICY "認証済みユーザーはstaff閲覧可能" ON staff FOR SELECT TO authenticated USING (true);
CREATE POLICY "認証済みユーザーはstaff追加可能" ON staff FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "認証済みユーザーはstaff更新可能" ON staff FOR UPDATE TO authenticated USING (true);
CREATE POLICY "認証済みユーザーはstaff削除可能" ON staff FOR DELETE TO authenticated USING (true);

CREATE POLICY "認証済みユーザーはduty_codes閲覧可能" ON duty_codes FOR SELECT TO authenticated USING (true);
CREATE POLICY "認証済みユーザーはduty_codes追加可能" ON duty_codes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "認証済みユーザーはduty_codes更新可能" ON duty_codes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "認証済みユーザーはduty_codes削除可能" ON duty_codes FOR DELETE TO authenticated USING (true);

CREATE POLICY "認証済みユーザーはlocations閲覧可能" ON locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "認証済みユーザーはlocations追加可能" ON locations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "認証済みユーザーはlocations更新可能" ON locations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "認証済みユーザーはlocations削除可能" ON locations FOR DELETE TO authenticated USING (true);

CREATE POLICY "認証済みユーザーはlocation_requirements閲覧可能" ON location_requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY "認証済みユーザーはlocation_requirements追加可能" ON location_requirements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "認証済みユーザーはlocation_requirements更新可能" ON location_requirements FOR UPDATE TO authenticated USING (true);
CREATE POLICY "認証済みユーザーはlocation_requirements削除可能" ON location_requirements FOR DELETE TO authenticated USING (true);

CREATE POLICY "認証済みユーザーはshift_requests閲覧可能" ON shift_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "認証済みユーザーはshift_requests追加可能" ON shift_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "認証済みユーザーはshift_requests更新可能" ON shift_requests FOR UPDATE TO authenticated USING (true);
CREATE POLICY "認証済みユーザーはshift_requests削除可能" ON shift_requests FOR DELETE TO authenticated USING (true);

CREATE POLICY "認証済みユーザーはshifts閲覧可能" ON shifts FOR SELECT TO authenticated USING (true);
CREATE POLICY "認証済みユーザーはshifts追加可能" ON shifts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "認証済みユーザーはshifts更新可能" ON shifts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "認証済みユーザーはshifts削除可能" ON shifts FOR DELETE TO authenticated USING (true);
