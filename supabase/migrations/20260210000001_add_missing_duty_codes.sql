-- Add Missing Duty Codes from Excel
-- Source: 【現状】アサイン.xlsb - 【現状アサイン】シート
-- Created: 2026-02-10
-- Description: Excelシフト表で勤務コードが未設定だった5つのシフトに対応する新規コードを追加

DO $$
BEGIN

  -- #4: 04:30-09:30 (4h45m, break:15m)
  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('04G4JA', '04:30', '09:30', 4, 45, 15, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  -- #8: 05:00-11:00 (7h00m, break:60m)
  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('05A7AA', '05:00', '11:00', 7, 0, 60, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  -- #11: 07:00-12:00 (5h00m, break:0)
  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('07A5AA', '07:00', '12:00', 5, 0, 0, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  -- #14: 13:00-20:30 (7h30m, break:60m)
  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('13A7GA', '13:00', '20:30', 7, 30, 60, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  -- #17: 13:00-22:00 (8h00m, break:60m)
  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('13A9AX', '13:00', '22:00', 8, 0, 60, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  RAISE NOTICE '新規勤務コード追加完了: 5 件 (04G4JA, 05A7AA, 07A5AA, 13A7GA, 13A9AX)';
END $$;
