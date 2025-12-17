-- メール送信スケジュールテーブル
create table if not exists email_schedules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  schedule_type text not null check (schedule_type in ('monthly', 'weekly', 'once')),
  cron_expression text,
  day_of_month int check (day_of_month between 1 and 31),
  day_of_week int check (day_of_week between 0 and 6),
  hour int not null default 9 check (hour between 0 and 23),
  minute int not null default 0 check (minute between 0 and 59),
  deadline_days int, -- 提出期限（何日後）
  is_active boolean not null default true,
  last_run_at timestamp with time zone,
  next_run_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- インデックス
create index if not exists email_schedules_is_active_idx on email_schedules(is_active);
create index if not exists email_schedules_next_run_at_idx on email_schedules(next_run_at);

-- 更新日時の自動更新
create trigger update_email_schedules_updated_at
  before update on email_schedules
  for each row
  execute function update_updated_at_column();

-- サンプルデータ（毎月20日9時に送信）
insert into email_schedules (name, description, schedule_type, day_of_month, hour, minute, deadline_days)
values (
  'シフト希望提出依頼（毎月20日）',
  '毎月20日の9時にシフト希望提出依頼メールを一括送信',
  'monthly',
  20,
  9,
  0,
  10
) on conflict do nothing;
