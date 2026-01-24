-- 同じ配置箇所・勤務コード・パターンの重複要件を防止する一意インデックス
-- day_of_week/specific_dateはNULL可能なのでCOALESCEでセンチネル値に変換
-- PostgreSQLのUNIQUE制約ではNULL != NULLとなるため、式インデックスで対応
CREATE UNIQUE INDEX idx_location_requirements_unique_pattern
  ON location_requirements (
    location_id,
    duty_code_id,
    COALESCE(day_of_week, -1),
    COALESCE(specific_date, '1900-01-01'::DATE)
  );
