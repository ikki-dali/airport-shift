-- 勤務記号データをクリアして再投入する

-- 既存の勤務記号データを削除
DELETE FROM duty_codes;

-- T3中央（第3ターミナル中央保安検査場） - 12種類
INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category) VALUES
  ('06A6AA', '06:00', '12:00', 6, 0, 0, false, 'T3中央'),
  ('06G5DA', '06:30', '11:45', 5, 15, 0, false, 'T3中央'),
  ('08J5DA', '08:45', '14:00', 5, 15, 0, false, 'T3中央'),
  ('14A5AA', '14:00', '19:00', 5, 0, 0, false, 'T3中央'),
  ('14A6AA', '14:00', '20:00', 6, 0, 0, false, 'T3中央'),
  ('14G5DA', '14:30', '19:45', 5, 15, 0, false, 'T3中央'),
  ('18A5AA', '18:00', '23:00', 5, 0, 0, false, 'T3中央'),
  ('18A5GA', '18:00', '23:25', 5, 25, 0, false, 'T3中央'),
  ('18G5DA', '18:30', '23:45', 5, 15, 0, false, 'T3中央'),
  ('22A5AA', '22:00', '03:00', 5, 0, 0, true, 'T3中央'),
  ('22A9AA', '22:00', '07:00', 9, 0, 60, true, 'T3中央'),
  ('22A9AY', '22:00', '07:00', 9, 0, 90, true, 'T3中央');

-- T3北（第3ターミナル北側検査場） - 3種類
INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category) VALUES
  ('06J0AW', '06:45', '16:45', 10, 0, 120, false, 'T3北'),
  ('15A7JA', '15:00', '22:35', 7, 35, 60, false, 'T3北'),
  ('17J5AA', '17:45', '22:45', 5, 0, 0, false, 'T3北');

-- T2中央（第2ターミナル国際線検査場） - 5種類
INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category) VALUES
  ('06A6AA', '06:00', '12:00', 6, 0, 0, false, 'T2中央'),
  ('19A5AA', '19:00', '00:00', 5, 0, 0, true, 'T2中央'),
  ('19A5GA', '19:00', '00:25', 5, 25, 0, true, 'T2中央'),
  ('06G5DA', '06:30', '11:45', 5, 15, 0, false, 'T2中央'),
  ('14A5AA', '14:00', '19:00', 5, 0, 0, false, 'T2中央');

-- バス案内業務 - 10種類
INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category) VALUES
  ('04J5AA', '04:45', '09:45', 5, 0, 0, false, 'バス案内'),
  ('05D8GA', '05:15', '14:00', 8, 45, 60, false, 'バス案内'),
  ('06A6AA', '06:00', '12:00', 6, 0, 0, false, 'バス案内'),
  ('18J6AA', '18:45', '00:45', 6, 0, 0, true, 'バス案内'),
  ('19A5AA', '19:00', '00:00', 5, 0, 0, true, 'バス案内'),
  ('19A8AA', '19:00', '03:00', 8, 0, 60, true, 'バス案内'),
  ('19G7JA', '19:30', '03:05', 7, 35, 60, true, 'バス案内'),
  ('22A5AA', '22:00', '03:00', 5, 0, 0, true, 'バス案内'),
  ('22A6AA', '22:00', '04:00', 6, 0, 60, true, 'バス案内'),
  ('22A8AA', '22:00', '06:00', 8, 0, 60, true, 'バス案内');

-- 横特業務（東方航空バゲージ） - 1種類
INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category) VALUES
  ('05G4AA', '05:30', '09:30', 4, 0, 0, false, '横特');
