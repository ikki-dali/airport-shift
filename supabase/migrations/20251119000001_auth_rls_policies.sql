-- =====================================================
-- 認証基盤構築: RLSポリシー再構築
-- TICKET-004: USING(true)の匿名アクセスポリシーを廃止し、
-- 認証済みユーザー(auth.uid() IS NOT NULL)のみ許可に変更
-- =====================================================

-- =====================================================
-- 1. 既存の匿名アクセスポリシーを全削除
--    (20251116000001_allow_anon_access.sql で作成されたもの)
-- =====================================================
DROP POLICY IF EXISTS "すべてのユーザーはroles閲覧可能" ON roles;
DROP POLICY IF EXISTS "すべてのユーザーはroles追加可能" ON roles;
DROP POLICY IF EXISTS "すべてのユーザーはroles更新可能" ON roles;
DROP POLICY IF EXISTS "すべてのユーザーはroles削除可能" ON roles;

DROP POLICY IF EXISTS "すべてのユーザーはtags閲覧可能" ON tags;
DROP POLICY IF EXISTS "すべてのユーザーはtags追加可能" ON tags;
DROP POLICY IF EXISTS "すべてのユーザーはtags更新可能" ON tags;
DROP POLICY IF EXISTS "すべてのユーザーはtags削除可能" ON tags;

DROP POLICY IF EXISTS "すべてのユーザーはstaff閲覧可能" ON staff;
DROP POLICY IF EXISTS "すべてのユーザーはstaff追加可能" ON staff;
DROP POLICY IF EXISTS "すべてのユーザーはstaff更新可能" ON staff;
DROP POLICY IF EXISTS "すべてのユーザーはstaff削除可能" ON staff;

DROP POLICY IF EXISTS "すべてのユーザーはduty_codes閲覧可能" ON duty_codes;
DROP POLICY IF EXISTS "すべてのユーザーはduty_codes追加可能" ON duty_codes;
DROP POLICY IF EXISTS "すべてのユーザーはduty_codes更新可能" ON duty_codes;
DROP POLICY IF EXISTS "すべてのユーザーはduty_codes削除可能" ON duty_codes;

DROP POLICY IF EXISTS "すべてのユーザーはlocations閲覧可能" ON locations;
DROP POLICY IF EXISTS "すべてのユーザーはlocations追加可能" ON locations;
DROP POLICY IF EXISTS "すべてのユーザーはlocations更新可能" ON locations;
DROP POLICY IF EXISTS "すべてのユーザーはlocations削除可能" ON locations;

DROP POLICY IF EXISTS "すべてのユーザーはlocation_requirements閲覧可能" ON location_requirements;
DROP POLICY IF EXISTS "すべてのユーザーはlocation_requirements追加可能" ON location_requirements;
DROP POLICY IF EXISTS "すべてのユーザーはlocation_requirements更新可能" ON location_requirements;
DROP POLICY IF EXISTS "すべてのユーザーはlocation_requirements削除可能" ON location_requirements;

DROP POLICY IF EXISTS "すべてのユーザーはshift_requests閲覧可能" ON shift_requests;
DROP POLICY IF EXISTS "すべてのユーザーはshift_requests追加可能" ON shift_requests;
DROP POLICY IF EXISTS "すべてのユーザーはshift_requests更新可能" ON shift_requests;
DROP POLICY IF EXISTS "すべてのユーザーはshift_requests削除可能" ON shift_requests;

DROP POLICY IF EXISTS "すべてのユーザーはshifts閲覧可能" ON shifts;
DROP POLICY IF EXISTS "すべてのユーザーはshifts追加可能" ON shifts;
DROP POLICY IF EXISTS "すべてのユーザーはshifts更新可能" ON shifts;
DROP POLICY IF EXISTS "すべてのユーザーはshifts削除可能" ON shifts;

-- =====================================================
-- 2. 給与テーブルの匿名アクセスポリシーを削除
--    (20251116000002_create_payroll_tables.sql で作成されたもの)
-- =====================================================
DROP POLICY IF EXISTS "Allow anonymous read access on payroll_records" ON payroll_records;
DROP POLICY IF EXISTS "Allow anonymous write access on payroll_records" ON payroll_records;
DROP POLICY IF EXISTS "Allow anonymous read access on annual_payroll_summary" ON annual_payroll_summary;
DROP POLICY IF EXISTS "Allow anonymous write access on annual_payroll_summary" ON annual_payroll_summary;
DROP POLICY IF EXISTS "Allow anonymous read access on staff_payroll_settings" ON staff_payroll_settings;
DROP POLICY IF EXISTS "Allow anonymous write access on staff_payroll_settings" ON staff_payroll_settings;

-- =====================================================
-- 3. 通知テーブルの既存ポリシーを削除（auth.uid() = staff_idはスタッフとauth.usersが
--    未連携のため使用不可。認証済みユーザー全員に許可に変更）
-- =====================================================
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;

-- =====================================================
-- 4. 新規ポリシー作成: 認証済みユーザーのみ全操作許可
--    (RBACは将来対応。現時点は認証さえすれば全操作可能)
-- =====================================================

-- roles
CREATE POLICY "authenticated_roles_all" ON roles
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- tags
CREATE POLICY "authenticated_tags_all" ON tags
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- staff
CREATE POLICY "authenticated_staff_all" ON staff
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- duty_codes
CREATE POLICY "authenticated_duty_codes_all" ON duty_codes
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- locations
CREATE POLICY "authenticated_locations_all" ON locations
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- location_requirements
CREATE POLICY "authenticated_location_requirements_all" ON location_requirements
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- shift_requests
CREATE POLICY "authenticated_shift_requests_all" ON shift_requests
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- shifts
CREATE POLICY "authenticated_shifts_all" ON shifts
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- notifications
CREATE POLICY "authenticated_notifications_all" ON notifications
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- 5. 給与テーブルの認証済みポリシーを統合
--    (既存のread/writeが分かれているものを削除し、FOR ALLに統合)
-- =====================================================
DROP POLICY IF EXISTS "Allow authenticated read access on payroll_records" ON payroll_records;
DROP POLICY IF EXISTS "Allow authenticated write access on payroll_records" ON payroll_records;
DROP POLICY IF EXISTS "Allow authenticated read access on annual_payroll_summary" ON annual_payroll_summary;
DROP POLICY IF EXISTS "Allow authenticated write access on annual_payroll_summary" ON annual_payroll_summary;
DROP POLICY IF EXISTS "Allow authenticated read access on staff_payroll_settings" ON staff_payroll_settings;
DROP POLICY IF EXISTS "Allow authenticated write access on staff_payroll_settings" ON staff_payroll_settings;

CREATE POLICY "authenticated_payroll_records_all" ON payroll_records
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_annual_payroll_summary_all" ON annual_payroll_summary
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_staff_payroll_settings_all" ON staff_payroll_settings
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- 6. confirm_shifts RPC関数のanon権限を削除
-- =====================================================
REVOKE EXECUTE ON FUNCTION confirm_shifts(UUID[], UUID) FROM anon;

-- =====================================================
-- 7. GRANTの整理（notificationsテーブル）
--    既存のauthenticated GRANTは維持しつつ、全操作許可に拡張
-- =====================================================
GRANT ALL ON public.notifications TO authenticated;
