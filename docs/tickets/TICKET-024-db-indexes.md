# TICKET-024: DBインデックス追加（クエリパフォーマンス）

## 担当
Infra

## 背景
- データ量増加時にクエリが遅くなるリスク
- 現在のスキーマにはPKとUNIQUE以外のインデックスがほぼない
- 頻繁にWHERE句で使われるカラムにインデックス追加が必要

## 要件

### 1. shiftsテーブル（最重要：全画面で参照）
```sql
CREATE INDEX idx_shifts_staff_date ON shifts(staff_id, date);
CREATE INDEX idx_shifts_location_date ON shifts(location_id, date);
CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_shifts_status ON shifts(status);
```

### 2. staff_shiftsテーブル
```sql
CREATE INDEX idx_staff_shifts_staff_date ON staff_shifts(staff_id, date);
```

### 3. shift_requestsテーブル
```sql
CREATE INDEX idx_shift_requests_staff ON shift_requests(staff_id);
CREATE INDEX idx_shift_requests_token ON shift_requests(token);
CREATE INDEX idx_shift_requests_status ON shift_requests(status);
```

### 4. notificationsテーブル
```sql
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
```

### 5. staffテーブル
```sql
CREATE INDEX idx_staff_active ON staff(is_active);
```

## 注意事項
- マイグレーションファイルとして作成（supabase/migrations/）
- `IF NOT EXISTS`をつけて冪等にする
- 既存データへの影響なし（INDEXの追加のみ）
- 本番適用時はメンテナンスウィンドウ不要（CONCURRENTLY使用推奨だがSupabaseマイグレーションでは不要）

## 完了条件
- [ ] マイグレーションファイルが作成されている
- [ ] `npm run build`が成功
- [ ] PRを作成してURL報告
