-- shift_requestsのrequest_type制約を更新
-- モバイルアプリ対応: ◯=出勤可能、△=できれば休み、×=出勤不可

-- 既存の制約を削除
ALTER TABLE shift_requests DROP CONSTRAINT IF EXISTS shift_requests_request_type_check;

-- 新しい制約を追加（旧形式と新形式の両方を許可）
ALTER TABLE shift_requests ADD CONSTRAINT shift_requests_request_type_check
  CHECK (request_type IN ('◯', '△', '×', '休', '早朝', '早番', '遅番', '夜勤'));

-- コメントを更新
COMMENT ON COLUMN shift_requests.request_type IS '希望タイプ（◯=出勤可能/△=できれば休み/×=出勤不可/休/早朝/早番/遅番/夜勤）';
