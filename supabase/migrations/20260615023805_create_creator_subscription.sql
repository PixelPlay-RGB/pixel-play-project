-- 크리에이터 구독 상태를 저장하는 테이블을 추가한다.

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'creator_subscription_status'
  ) then
    create type public.creator_subscription_status as enum ('active', 'expired', 'canceled');
  end if;
end;
$$;

create table if not exists public.creator_subscription (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public."user"(id) on delete cascade,
  subscriber_id uuid not null references public."user"(id) on delete cascade,
  started_at timestamp with time zone not null default now(),
  end_at timestamp with time zone not null,
  total_months integer not null default 1,
  status public.creator_subscription_status not null default 'active',
  created_at timestamp with time zone not null default now(),
  constraint creator_subscription_creator_subscriber_key unique (creator_id, subscriber_id),
  constraint creator_subscription_not_self check (creator_id <> subscriber_id),
  constraint creator_subscription_end_after_started check (end_at > started_at),
  constraint creator_subscription_total_months_positive check (total_months > 0)
);

create index if not exists creator_subscription_subscriber_status_end_idx
  on public.creator_subscription (subscriber_id, status, end_at desc);

create index if not exists creator_subscription_creator_status_end_idx
  on public.creator_subscription (creator_id, status, end_at desc);

alter table public.creator_subscription enable row level security;

revoke all privileges on table public.creator_subscription from public;
revoke all privileges on table public.creator_subscription from anon;
revoke all privileges on table public.creator_subscription from authenticated;

grant select on table public.creator_subscription to authenticated;
grant select, insert, update, delete on table public.creator_subscription to service_role;

drop policy if exists creator_subscription_select_as_subscriber on public.creator_subscription;
create policy creator_subscription_select_as_subscriber
  on public.creator_subscription
  for select
  to authenticated
  using (subscriber_id = (select auth.uid()));

drop policy if exists creator_subscription_select_as_creator on public.creator_subscription;
create policy creator_subscription_select_as_creator
  on public.creator_subscription
  for select
  to authenticated
  using (creator_id = (select auth.uid()));
