-- スタッフテーブルに雇用形態カラムを追加
ALTER TABLE staff ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'part_time';

-- 既存データの更新（社員番号0001-0030は契約社員、それ以外はパート）
UPDATE staff 
SET employment_type = 'contract' 
WHERE CAST(employee_number AS INTEGER) <= 30;

UPDATE staff 
SET employment_type = 'part_time' 
WHERE CAST(employee_number AS INTEGER) > 30;

-- コメントを追加
COMMENT ON COLUMN staff.employment_type IS '雇用形態（contract: 契約社員, part_time: パート）';
