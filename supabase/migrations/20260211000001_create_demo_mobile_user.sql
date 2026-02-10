-- モバイルアプリ デモユーザー作成 + 認証用RPC関数
-- Created: 2026-02-11

-- =====================================================
-- 1. デモユーザー「山本一気」をstaffテーブルに追加
-- =====================================================
INSERT INTO staff (employee_number, name, email, employment_type, is_active)
VALUES ('0151', '山本一気', 'yamamoto@example.com', 'contract', true)
ON CONFLICT (employee_number) DO NOTHING;

-- =====================================================
-- 2. RPC関数: 社員番号 → メールアドレス変換
--    ログイン前にanon権限で呼び出す
-- =====================================================
CREATE OR REPLACE FUNCTION get_staff_email_by_employee_number(emp_no TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  staff_email TEXT;
BEGIN
  SELECT email INTO staff_email
  FROM staff
  WHERE employee_number = emp_no AND is_active = true;

  RETURN staff_email;
END;
$$;

-- anon権限で実行可能にする（ログイン前に必要）
GRANT EXECUTE ON FUNCTION get_staff_email_by_employee_number(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_staff_email_by_employee_number(TEXT) TO authenticated;

-- =====================================================
-- 3. デモ用シフトを山本一気に割り当て
--    今日から7日分のシフトを作成
-- =====================================================
DO $$
DECLARE
  v_staff_id UUID;
  v_location_ids UUID[];
  v_duty_code_ids UUID[];
  v_i INTEGER;
  v_date DATE;
  v_loc_id UUID;
  v_dc_id UUID;
BEGIN
  -- 山本一気のIDを取得
  SELECT id INTO v_staff_id FROM staff WHERE employee_number = '0151';

  IF v_staff_id IS NULL THEN
    RAISE NOTICE 'Staff 0151 not found, skipping shift creation';
    RETURN;
  END IF;

  -- 使える配属先を取得（最大5件）
  SELECT ARRAY(SELECT id FROM locations WHERE is_active = true LIMIT 5)
  INTO v_location_ids;

  -- 使える勤務記号を取得（最大5件）
  SELECT ARRAY(SELECT id FROM duty_codes LIMIT 5)
  INTO v_duty_code_ids;

  -- 今日から7日間のシフトを作成
  FOR v_i IN 0..6 LOOP
    v_date := CURRENT_DATE + v_i;
    v_loc_id := v_location_ids[1 + (v_i % array_length(v_location_ids, 1))];
    v_dc_id := v_duty_code_ids[1 + (v_i % array_length(v_duty_code_ids, 1))];

    INSERT INTO shifts (staff_id, location_id, duty_code_id, date, status)
    VALUES (v_staff_id, v_loc_id, v_dc_id, v_date, '確定')
    ON CONFLICT (staff_id, date) DO NOTHING;
  END LOOP;
END;
$$;
