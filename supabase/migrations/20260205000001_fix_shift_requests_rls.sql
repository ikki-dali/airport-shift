-- shift_requestsテーブルのRLSポリシーを確実に適用
-- モバイルアプリからの匿名アクセスを許可

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "認証済みユーザーはshift_requests閲覧可能" ON shift_requests;
DROP POLICY IF EXISTS "認証済みユーザーはshift_requests追加可能" ON shift_requests;
DROP POLICY IF EXISTS "認証済みユーザーはshift_requests更新可能" ON shift_requests;
DROP POLICY IF EXISTS "認証済みユーザーはshift_requests削除可能" ON shift_requests;

DROP POLICY IF EXISTS "すべてのユーザーはshift_requests閲覧可能" ON shift_requests;
DROP POLICY IF EXISTS "すべてのユーザーはshift_requests追加可能" ON shift_requests;
DROP POLICY IF EXISTS "すべてのユーザーはshift_requests更新可能" ON shift_requests;
DROP POLICY IF EXISTS "すべてのユーザーはshift_requests削除可能" ON shift_requests;

-- RLSを有効化（既に有効な場合はスキップ）
ALTER TABLE shift_requests ENABLE ROW LEVEL SECURITY;

-- 匿名ユーザーでもアクセスできるポリシーを作成
CREATE POLICY "すべてのユーザーはshift_requests閲覧可能" ON shift_requests FOR SELECT USING (true);
CREATE POLICY "すべてのユーザーはshift_requests追加可能" ON shift_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "すべてのユーザーはshift_requests更新可能" ON shift_requests FOR UPDATE USING (true);
CREATE POLICY "すべてのユーザーはshift_requests削除可能" ON shift_requests FOR DELETE USING (true);
