-- Fix duty_codes unique constraint
-- Change from code-only unique to (code, category) composite unique

-- 既存のユニーク制約を削除
ALTER TABLE duty_codes DROP CONSTRAINT duty_codes_code_key;

-- 複合ユニーク制約を追加
ALTER TABLE duty_codes ADD CONSTRAINT duty_codes_code_category_key UNIQUE (code, category);

-- 既存のインデックスも更新
DROP INDEX IF EXISTS idx_duty_codes_code;
CREATE INDEX idx_duty_codes_code_category ON duty_codes(code, category);

-- コメントを追加
COMMENT ON CONSTRAINT duty_codes_code_category_key ON duty_codes IS 'コードとカテゴリの組み合わせで一意性を保証';
