-- 인앱 알림 수신함: notification 테이블 + 읽음 기준(last_seen) + RLS + realtime

create table if not exists public.notification (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public."user"(id) on delete cascade,
  type text not null check (type in ('live_start', 'community_post')),
  actor_id uuid not null references public."user"(id) on delete cascade,
  actor_nickname text,
  actor_photo_url text,
  title text not null,
  body text,
  link_path text not null,
  resource_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists notification_recipient_created_idx
  on public.notification (recipient_id, created_at desc);

alter table public.notification enable row level security;

drop policy if exists notification_select_own on public.notification;
create policy notification_select_own
  on public.notification for select to authenticated
  using (recipient_id = (select auth.uid()));

grant select on table public.notification to authenticated;

-- 읽음 = 방문 기준(유저당 마지막 확인 시각)
alter table public."user"
  add column if not exists notifications_last_seen_at timestamptz;

-- 실시간: 수신자 본인 INSERT를 종 배지에 즉시 반영 (중복 add 방지)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notification'
  ) then
    alter publication supabase_realtime add table public.notification;
  end if;
end $$;
