-- シフト希望のサンプルデータを追加
-- 既存のスタッフに対して、今月と来月の希望データを生成

-- 古いCHECK制約を削除
ALTER TABLE shift_requests DROP CONSTRAINT IF EXISTS shift_requests_request_type_check;

-- 既存の古い形式のデータを新しい形式に変換
UPDATE shift_requests SET request_type = 'A' WHERE request_type = '早朝';
UPDATE shift_requests SET request_type = 'B' WHERE request_type = '早番';
UPDATE shift_requests SET request_type = 'E' WHERE request_type = '遅番';
UPDATE shift_requests SET request_type = 'G' WHERE request_type = '夜勤';
UPDATE shift_requests SET request_type = '休' WHERE request_type NOT IN ('◯', '休', '有給', 'A', 'B', 'C', 'D', 'E', 'F', 'G');

-- 新しいCHECK制約を追加
ALTER TABLE shift_requests ADD CONSTRAINT shift_requests_request_type_check 
  CHECK (request_type IN ('◯', '休', '有給', 'A', 'B', 'C', 'D', 'E', 'F', 'G'));

-- 既存のシフト希望を削除（今月以降のテストデータ用）
DELETE FROM shift_requests WHERE year_month >= '2026-02';

-- スタッフIDを取得してシフト希望を生成
DO $$
DECLARE
    staff_record RECORD;
    loop_date DATE;
    end_date DATE;
    request_types TEXT[] := ARRAY['◯', '休', '有給', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];
    preferred_slots TEXT[];
    selected_type TEXT;
    day_of_week INT;
    rand_val FLOAT;
    staff_idx INT := 0;
BEGIN
    -- 今月の1日から来月末まで
    loop_date := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    end_date := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '2 months' - INTERVAL '1 day')::DATE;
    
    -- 各スタッフに対して希望を生成
    FOR staff_record IN SELECT id FROM staff WHERE is_active = true LIMIT 50 LOOP
        staff_idx := staff_idx + 1;
        
        -- スタッフごとの好みの時間帯を決定（1-3個）
        CASE (staff_idx % 7)
            WHEN 0 THEN preferred_slots := ARRAY['A', 'B'];
            WHEN 1 THEN preferred_slots := ARRAY['B', 'C'];
            WHEN 2 THEN preferred_slots := ARRAY['C', 'D'];
            WHEN 3 THEN preferred_slots := ARRAY['D', 'E'];
            WHEN 4 THEN preferred_slots := ARRAY['E', 'F'];
            WHEN 5 THEN preferred_slots := ARRAY['F', 'G'];
            WHEN 6 THEN preferred_slots := ARRAY['A', 'G'];
        END CASE;
        
        -- 日付ごとに希望を生成
        WHILE loop_date <= end_date LOOP
            day_of_week := EXTRACT(DOW FROM loop_date);
            rand_val := RANDOM();
            
            -- 70%の確率で希望を提出
            IF rand_val < 0.7 THEN
                rand_val := RANDOM();
                
                -- 土日は休み希望が多め
                IF day_of_week IN (0, 6) THEN
                    IF rand_val < 0.4 THEN
                        selected_type := '休';
                    ELSIF rand_val < 0.45 THEN
                        selected_type := '有給';
                    ELSIF rand_val < 0.55 THEN
                        selected_type := '◯';
                    ELSE
                        selected_type := preferred_slots[1 + FLOOR(RANDOM() * ARRAY_LENGTH(preferred_slots, 1))::INT];
                        IF selected_type IS NULL THEN selected_type := preferred_slots[1]; END IF;
                    END IF;
                ELSE
                    -- 平日
                    IF rand_val < 0.10 THEN
                        selected_type := '休';
                    ELSIF rand_val < 0.12 THEN
                        selected_type := '有給';
                    ELSIF rand_val < 0.25 THEN
                        selected_type := '◯';
                    ELSE
                        selected_type := preferred_slots[1 + FLOOR(RANDOM() * ARRAY_LENGTH(preferred_slots, 1))::INT];
                        IF selected_type IS NULL THEN selected_type := preferred_slots[1]; END IF;
                    END IF;
                END IF;
                
                INSERT INTO shift_requests (staff_id, date, request_type, year_month)
                VALUES (staff_record.id, loop_date, selected_type, TO_CHAR(loop_date, 'YYYY-MM'))
                ON CONFLICT (staff_id, date) DO UPDATE SET request_type = EXCLUDED.request_type;
            END IF;
            
            loop_date := loop_date + INTERVAL '1 day';
        END LOOP;
        
        -- 次のスタッフのためにリセット
        loop_date := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    END LOOP;
END $$;
