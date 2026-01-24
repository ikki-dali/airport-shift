-- TICKET-024: DBインデックス追加（クエリパフォーマンス向上）
-- 冪等性のためIF NOT EXISTSを使用

-- =====================================================
-- 1. shiftsテーブル
-- =====================================================
-- (staff_id, date) 複合インデックス
-- NOTE: UNIQUE制約 unique_staff_date_shift が暗黙的にカバーするが、
--       クエリプランナーの明示的なヒントとして追加
CREATE INDEX IF NOT EXISTS idx_shifts_staff_date ON shifts(staff_id, date);

-- 以下は初期スキーマで作成済みだが、冪等性のため記載
CREATE INDEX IF NOT EXISTS idx_shifts_location_date ON shifts(location_id, date);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);

-- =====================================================
-- 2. notificationsテーブル
-- =====================================================
-- 複合インデックス: 未読通知の効率的な取得
-- チケットでは(user_id, is_read)だが実テーブルはstaff_idを使用
CREATE INDEX IF NOT EXISTS idx_notifications_staff_read ON notifications(staff_id, is_read);

-- =====================================================
-- 3. shift_requestsテーブル
-- =====================================================
-- staff_idインデックスは初期スキーマで作成済み（idx_shift_requests_staff_id）
-- NOTE: チケットのtokenカラム、statusカラムは現テーブルに存在しないためスキップ

-- =====================================================
-- 4. staffテーブル
-- =====================================================
-- is_activeインデックスは初期スキーマで作成済み（idx_staff_is_active）
-- 冪等性のため記載
CREATE INDEX IF NOT EXISTS idx_staff_is_active ON staff(is_active);

-- =====================================================
-- NOTE: staff_shiftsテーブルは現スキーマに存在しないためスキップ
-- =====================================================
