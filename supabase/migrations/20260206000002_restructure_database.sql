-- Database Restructure: Shift Management System
-- Created: 2026-02-06
-- Description: 勤務記号と業務配分の構造を改善

-- =====================================================
-- 1. 業務種別マスタテーブル（task_types）
-- =====================================================
CREATE TABLE IF NOT EXISTS task_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE task_types IS '業務種別マスタ';
COMMENT ON COLUMN task_types.code IS '業務コード（BANDAI, OSS等）';
COMMENT ON COLUMN task_types.name IS '業務名（番台, OSS等）';

-- 業務種別の初期データ
INSERT INTO task_types (code, name, description, display_order) VALUES
  ('BANDAI', '番台', '保安検査場案内業務（番台）', 1),
  ('OSS', 'OSS', 'OSS業務', 2),
  ('SOLASEED', 'ソラシド', 'ソラシドエア関連業務', 3),
  ('MU', 'MU', '中国東方航空（MU）関連業務', 4),
  ('MC', 'MC', 'MC関連業務', 5),
  ('KE', 'KE', '大韓航空（KE）関連業務', 6),
  ('TG', 'TG', 'タイ国際航空（TG）関連業務', 7),
  ('BUS', '際際バス', '国際線間バス案内業務', 8)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 2. duty_codesテーブルの再構築
-- =====================================================

-- 既存のduty_codesを削除して再作成（依存関係に注意）
-- まず外部キー制約を一時的に無効化するため、shiftsとlocation_requirementsのduty_code_idをNULL許可に

-- duty_codesの構造を確認し、必要なカラムを追加
ALTER TABLE duty_codes ADD COLUMN IF NOT EXISTS total_hours DECIMAL(4,2);

-- total_hoursを計算して更新
UPDATE duty_codes 
SET total_hours = duration_hours + (duration_minutes / 60.0)
WHERE total_hours IS NULL;

-- =====================================================
-- 3. シフト業務配分テーブル（shift_tasks）
-- =====================================================
CREATE TABLE IF NOT EXISTS shift_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  task_type_id UUID NOT NULL REFERENCES task_types(id) ON DELETE RESTRICT,
  hours DECIMAL(4,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shift_id, task_type_id)
);

COMMENT ON TABLE shift_tasks IS 'シフトごとの業務配分';
COMMENT ON COLUMN shift_tasks.hours IS '業務に割り当てられた時間（時間単位）';

CREATE INDEX IF NOT EXISTS idx_shift_tasks_shift_id ON shift_tasks(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_tasks_task_type_id ON shift_tasks(task_type_id);

-- RLSポリシー
ALTER TABLE task_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_task_types_all" ON task_types
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_shift_tasks_all" ON shift_tasks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 更新トリガー
CREATE TRIGGER update_task_types_updated_at
  BEFORE UPDATE ON task_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_tasks_updated_at
  BEFORE UPDATE ON shift_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. 勤務コードの再投入（Excelデータから）
-- =====================================================

-- 勤務コードデータの更新

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('04A5GA', '04:00', '09:30', 5, 30, 0, false, 'T3中央', 5.5)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('04J5JA', '04:45', '10:30', 5, 45, 0, false, 'T3中央', 5.75)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('05D5AA', '05:15', '10:15', 5, 0, 0, false, 'T3中央', 5.0)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('05G5AA', '05:30', '10:30', 5, 0, 0, false, 'T3中央', 5.0)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('06A6AA', '06:00', '12:00', 6, 0, 0, false, 'T3中央', 6.0)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('06A9A', '06:00', '15:00', 8, 0, 60, false, 'T3中央', 8.0)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('06G9AY', '06:30', '15:30', 7, 30, 90, false, 'T3中央', 7.5)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('06J1JT', '06:45', '18:30', 9, 0, 165, false, 'T3中央', 9.0)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('06J9AW', '06:45', '15:45', 7, 0, 120, false, 'T3中央', 7.0)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('07A2GY', '07:00', '19:30', 11, 0, 90, false, 'T3中央', 11.0)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('07G2AY', '07:30', '18:00', 9, 0, 90, false, 'T3中央', 9.0)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('09G2GY', '09:30', '22:00', 11, 0, 90, false, 'T3中央', 11.0)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('10A5AA', '10:00', '15:00', 5, 0, 0, false, 'T3中央', 5.0)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('12A8AY', '12:00', '20:00', 6, 30, 90, false, 'T3中央', 6.5)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('12A9A', '12:00', '21:00', 8, 0, 60, false, 'T3中央', 8.0)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('13A9A', '13:00', '22:00', 8, 0, 60, false, 'T3中央', 8.0)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('13J5DA', '13:45', '19:00', 5, 15, 0, false, 'T3中央', 5.25)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('14A5AA', '14:00', '19:00', 5, 0, 0, false, 'T3中央', 5.0)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('14A9A', '14:00', '23:00', 8, 0, 60, false, 'T3中央', 8.0)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('14D7JY', '14:15', '22:00', 6, 15, 90, false, 'T3中央', 6.25)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('14D8G', '14:15', '22:45', 7, 30, 60, false, 'T3中央', 7.5)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('14G4GA', '14:30', '19:00', 4, 30, 0, false, 'T3中央', 4.5)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('14J8D', '14:45', '23:00', 7, 15, 60, false, 'T3中央', 7.25)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('15A5AA', '15:00', '20:00', 5, 0, 0, false, 'T3中央', 5.0)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('15A7J', '15:00', '22:45', 6, 45, 60, false, 'T3中央', 6.75)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('16G6GG', '16:30', '23:00', 6, 0, 30, false, 'T3中央', 6.0)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('18G4GA', '18:30', '23:00', 4, 30, 0, false, 'T3中央', 4.5)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('19A1AO', '19:00', '06:00', 7, 0, 240, true, 'T3中央', 7.0)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('19A4AA', '19:00', '23:00', 4, 0, 0, false, 'T3中央', 4.0)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('22A0AY', '22:00', '08:00', 8, 30, 90, true, 'T3中央', 8.5)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('22A8AW', '22:00', '06:00', 6, 0, 120, true, 'T3中央', 6.0)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('22A9GY', '22:00', '07:30', 8, 0, 90, true, 'T3中央', 8.0)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category, total_hours)
VALUES ('23A1AO', '23:00', '10:00', 7, 0, 240, true, 'T3中央', 7.0)
ON CONFLICT (code, category) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  duration_hours = EXCLUDED.duration_hours,
  duration_minutes = EXCLUDED.duration_minutes,
  break_minutes = EXCLUDED.break_minutes,
  is_overnight = EXCLUDED.is_overnight,
  total_hours = EXCLUDED.total_hours,
  updated_at = NOW();

-- =====================================================
-- 確認用
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'データベース再構築完了';
  RAISE NOTICE '- 業務種別: % 件', (SELECT COUNT(*) FROM task_types);
  RAISE NOTICE '- 勤務コード: % 件', (SELECT COUNT(*) FROM duty_codes);
END $$;
