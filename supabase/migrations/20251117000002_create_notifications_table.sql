-- Create notifications table for in-app notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  type text not null check (type in ('shift_created', 'shift_updated', 'shift_deleted', 'shift_confirmed', 'shift_request')),
  title text not null,
  message text not null,
  related_shift_id uuid references public.shifts(id) on delete set null,
  is_read boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for faster queries
create index notifications_staff_id_idx on public.notifications(staff_id);
create index notifications_created_at_idx on public.notifications(created_at desc);
create index notifications_is_read_idx on public.notifications(is_read);

-- Enable Row Level Security
alter table public.notifications enable row level security;

-- Policies: Staff can only see their own notifications
create policy "Users can view own notifications"
  on public.notifications
  for select
  using (auth.uid() = staff_id);

create policy "Users can update own notifications"
  on public.notifications
  for update
  using (auth.uid() = staff_id);

-- Admins can create notifications for any staff
create policy "Admins can create notifications"
  on public.notifications
  for insert
  with check (true);

-- Grant permissions
grant select, update on public.notifications to authenticated;
grant insert on public.notifications to authenticated;

-- Add trigger to update updated_at
create or replace function public.update_notifications_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_notifications_updated_at
  before update on public.notifications
  for each row
  execute function public.update_notifications_updated_at();
