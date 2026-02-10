-- Update Duty Codes from Excel File
-- Source: 【現状】アサイン.xlsb
-- Created: 2026-02-06
-- Description: Excelファイルの勤務時間を反映（33件の勤務コード）

-- =====================================================
-- 既存の勤務コードを更新・新規追加
-- =====================================================

DO $$
BEGIN

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('04A5GA', '04:00', '09:30', 5, 30, 0, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('04J5JA', '04:45', '10:30', 5, 45, 0, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('05D5AA', '05:15', '10:15', 5, 0, 0, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('05G5AA', '05:30', '10:30', 5, 0, 0, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('06A6AA', '06:00', '12:00', 6, 0, 0, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('06A9A', '06:00', '15:00', 8, 0, 60, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('06G9AY', '06:30', '15:30', 7, 30, 90, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('06J1JT', '06:45', '18:30', 9, 0, 165, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('06J9AW', '06:45', '15:45', 7, 0, 120, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('07A2GY', '07:00', '19:30', 11, 0, 90, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('07G2AY', '07:30', '18:00', 9, 0, 90, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('09G2GY', '09:30', '22:00', 11, 0, 90, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('10A5AA', '10:00', '15:00', 5, 0, 0, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('12A8AY', '12:00', '20:00', 6, 30, 90, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('12A9A', '12:00', '21:00', 8, 0, 60, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('13A9A', '13:00', '22:00', 8, 0, 60, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('13J5DA', '13:45', '19:00', 5, 15, 0, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('14A5AA', '14:00', '19:00', 5, 0, 0, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('14A9A', '14:00', '23:00', 8, 0, 60, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('14D7JY', '14:15', '22:00', 6, 15, 90, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('14D8G', '14:15', '22:45', 7, 30, 60, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('14G4GA', '14:30', '19:00', 4, 30, 0, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('14J8D', '14:45', '23:00', 7, 15, 60, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('15A5AA', '15:00', '20:00', 5, 0, 0, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('15A7J', '15:00', '22:45', 6, 45, 60, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('16G6GG', '16:30', '23:00', 6, 0, 30, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('18G4GA', '18:30', '23:00', 4, 30, 0, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('19A1AO', '19:00', '06:00', 7, 0, 240, true, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('19A4AA', '19:00', '23:00', 4, 0, 0, false, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('22A0AY', '22:00', '08:00', 8, 30, 90, true, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('22A8AW', '22:00', '06:00', 6, 0, 120, true, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('22A9GY', '22:00', '07:30', 8, 0, 90, true, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  INSERT INTO duty_codes (code, start_time, end_time, duration_hours, duration_minutes, break_minutes, is_overnight, category)
  VALUES ('23A1AO', '23:00', '10:00', 7, 0, 240, true, 'T3中央')
  ON CONFLICT (code, category) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    duration_hours = EXCLUDED.duration_hours,
    duration_minutes = EXCLUDED.duration_minutes,
    break_minutes = EXCLUDED.break_minutes,
    is_overnight = EXCLUDED.is_overnight,
    updated_at = NOW();

  RAISE NOTICE '勤務コード更新完了: 33 件処理';
END $$;
