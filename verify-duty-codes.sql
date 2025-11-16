-- データを確認
SELECT code, category, COUNT(*)
FROM duty_codes
GROUP BY code, category
ORDER BY code, category;

-- 全件数を確認
SELECT COUNT(*) as total_count FROM duty_codes;

-- 6文字でないコードを探す
SELECT code, category, LENGTH(code) as code_length
FROM duty_codes
WHERE LENGTH(code) != 6
ORDER BY code;
