-- 開発中は匿名ユーザーでもアクセスできるようにRLSポリシーを変更
-- 本番環境では認証を実装してから元に戻すこと

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "認証済みユーザーはroles閲覧可能" ON roles;
DROP POLICY IF EXISTS "認証済みユーザーはroles追加可能" ON roles;
DROP POLICY IF EXISTS "認証済みユーザーはroles更新可能" ON roles;
DROP POLICY IF EXISTS "認証済みユーザーはroles削除可能" ON roles;

DROP POLICY IF EXISTS "認証済みユーザーはtags閲覧可能" ON tags;
DROP POLICY IF EXISTS "認証済みユーザーはtags追加可能" ON tags;
DROP POLICY IF EXISTS "認証済みユーザーはtags更新可能" ON tags;
DROP POLICY IF EXISTS "認証済みユーザーはtags削除可能" ON tags;

DROP POLICY IF EXISTS "認証済みユーザーはstaff閲覧可能" ON staff;
DROP POLICY IF EXISTS "認証済みユーザーはstaff追加可能" ON staff;
DROP POLICY IF EXISTS "認証済みユーザーはstaff更新可能" ON staff;
DROP POLICY IF EXISTS "認証済みユーザーはstaff削除可能" ON staff;

DROP POLICY IF EXISTS "認証済みユーザーはduty_codes閲覧可能" ON duty_codes;
DROP POLICY IF EXISTS "認証済みユーザーはduty_codes追加可能" ON duty_codes;
DROP POLICY IF EXISTS "認証済みユーザーはduty_codes更新可能" ON duty_codes;
DROP POLICY IF EXISTS "認証済みユーザーはduty_codes削除可能" ON duty_codes;

DROP POLICY IF EXISTS "認証済みユーザーはlocations閲覧可能" ON locations;
DROP POLICY IF EXISTS "認証済みユーザーはlocations追加可能" ON locations;
DROP POLICY IF EXISTS "認証済みユーザーはlocations更新可能" ON locations;
DROP POLICY IF EXISTS "認証済みユーザーはlocations削除可能" ON locations;

DROP POLICY IF EXISTS "認証済みユーザーはlocation_requirements閲覧可能" ON location_requirements;
DROP POLICY IF EXISTS "認証済みユーザーはlocation_requirements追加可能" ON location_requirements;
DROP POLICY IF EXISTS "認証済みユーザーはlocation_requirements更新可能" ON location_requirements;
DROP POLICY IF EXISTS "認証済みユーザーはlocation_requirements削除可能" ON location_requirements;

DROP POLICY IF EXISTS "認証済みユーザーはshift_requests閲覧可能" ON shift_requests;
DROP POLICY IF EXISTS "認証済みユーザーはshift_requests追加可能" ON shift_requests;
DROP POLICY IF EXISTS "認証済みユーザーはshift_requests更新可能" ON shift_requests;
DROP POLICY IF EXISTS "認証済みユーザーはshift_requests削除可能" ON shift_requests;

DROP POLICY IF EXISTS "認証済みユーザーはshifts閲覧可能" ON shifts;
DROP POLICY IF EXISTS "認証済みユーザーはshifts追加可能" ON shifts;
DROP POLICY IF EXISTS "認証済みユーザーはshifts更新可能" ON shifts;
DROP POLICY IF EXISTS "認証済みユーザーはshifts削除可能" ON shifts;

-- 匿名ユーザーでもアクセスできるポリシーを作成
CREATE POLICY "すべてのユーザーはroles閲覧可能" ON roles FOR SELECT USING (true);
CREATE POLICY "すべてのユーザーはroles追加可能" ON roles FOR INSERT WITH CHECK (true);
CREATE POLICY "すべてのユーザーはroles更新可能" ON roles FOR UPDATE USING (true);
CREATE POLICY "すべてのユーザーはroles削除可能" ON roles FOR DELETE USING (true);

CREATE POLICY "すべてのユーザーはtags閲覧可能" ON tags FOR SELECT USING (true);
CREATE POLICY "すべてのユーザーはtags追加可能" ON tags FOR INSERT WITH CHECK (true);
CREATE POLICY "すべてのユーザーはtags更新可能" ON tags FOR UPDATE USING (true);
CREATE POLICY "すべてのユーザーはtags削除可能" ON tags FOR DELETE USING (true);

CREATE POLICY "すべてのユーザーはstaff閲覧可能" ON staff FOR SELECT USING (true);
CREATE POLICY "すべてのユーザーはstaff追加可能" ON staff FOR INSERT WITH CHECK (true);
CREATE POLICY "すべてのユーザーはstaff更新可能" ON staff FOR UPDATE USING (true);
CREATE POLICY "すべてのユーザーはstaff削除可能" ON staff FOR DELETE USING (true);

CREATE POLICY "すべてのユーザーはduty_codes閲覧可能" ON duty_codes FOR SELECT USING (true);
CREATE POLICY "すべてのユーザーはduty_codes追加可能" ON duty_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "すべてのユーザーはduty_codes更新可能" ON duty_codes FOR UPDATE USING (true);
CREATE POLICY "すべてのユーザーはduty_codes削除可能" ON duty_codes FOR DELETE USING (true);

CREATE POLICY "すべてのユーザーはlocations閲覧可能" ON locations FOR SELECT USING (true);
CREATE POLICY "すべてのユーザーはlocations追加可能" ON locations FOR INSERT WITH CHECK (true);
CREATE POLICY "すべてのユーザーはlocations更新可能" ON locations FOR UPDATE USING (true);
CREATE POLICY "すべてのユーザーはlocations削除可能" ON locations FOR DELETE USING (true);

CREATE POLICY "すべてのユーザーはlocation_requirements閲覧可能" ON location_requirements FOR SELECT USING (true);
CREATE POLICY "すべてのユーザーはlocation_requirements追加可能" ON location_requirements FOR INSERT WITH CHECK (true);
CREATE POLICY "すべてのユーザーはlocation_requirements更新可能" ON location_requirements FOR UPDATE USING (true);
CREATE POLICY "すべてのユーザーはlocation_requirements削除可能" ON location_requirements FOR DELETE USING (true);

CREATE POLICY "すべてのユーザーはshift_requests閲覧可能" ON shift_requests FOR SELECT USING (true);
CREATE POLICY "すべてのユーザーはshift_requests追加可能" ON shift_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "すべてのユーザーはshift_requests更新可能" ON shift_requests FOR UPDATE USING (true);
CREATE POLICY "すべてのユーザーはshift_requests削除可能" ON shift_requests FOR DELETE USING (true);

CREATE POLICY "すべてのユーザーはshifts閲覧可能" ON shifts FOR SELECT USING (true);
CREATE POLICY "すべてのユーザーはshifts追加可能" ON shifts FOR INSERT WITH CHECK (true);
CREATE POLICY "すべてのユーザーはshifts更新可能" ON shifts FOR UPDATE USING (true);
CREATE POLICY "すべてのユーザーはshifts削除可能" ON shifts FOR DELETE USING (true);
