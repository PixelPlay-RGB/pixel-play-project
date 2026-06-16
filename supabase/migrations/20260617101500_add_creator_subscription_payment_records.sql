-- 라이브 구독 Toss 결제 주문과 승인 결과를 기록한다.

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'creator_subscription_payment_status'
  ) then
    create type public.creator_subscription_payment_status as enum (
      'pending',
      'succeeded',
      'failed',
      'canceled'
    );
  end if;
end $$;

create table if not exists public.creator_subscription_payment (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public."user"(id) on delete cascade,
  subscriber_id uuid not null references public."user"(id) on delete cascade,
  subscription_id uuid references public.creator_subscription(id) on delete set null,
  payment_status public.creator_subscription_payment_status not null default 'pending',
  amount integer not null,
  order_id text not null,
  payment_key text,
  idempotency_key text not null,
  provider text not null default 'toss',
  failure_code text,
  failure_message text,
  metadata jsonb not null default '{}'::jsonb,
  requested_at timestamp with time zone not null default now(),
  approved_at timestamp with time zone,
  failed_at timestamp with time zone,
  canceled_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  constraint creator_subscription_payment_not_self check (creator_id <> subscriber_id),
  constraint creator_subscription_payment_amount_positive check (amount > 0),
  constraint creator_subscription_payment_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint creator_subscription_payment_provider_not_empty check (btrim(provider) <> ''),
  constraint creator_subscription_payment_order_id_not_empty check (btrim(order_id) <> ''),
  constraint creator_subscription_payment_idempotency_key_not_empty check (btrim(idempotency_key) <> '')
);

create unique index if not exists creator_subscription_payment_order_id_idx
  on public.creator_subscription_payment (order_id);

create unique index if not exists creator_subscription_payment_idempotency_key_idx
  on public.creator_subscription_payment (idempotency_key);

create unique index if not exists creator_subscription_payment_payment_key_idx
  on public.creator_subscription_payment (payment_key)
  where payment_key is not null;

create index if not exists creator_subscription_payment_subscriber_status_created_idx
  on public.creator_subscription_payment (subscriber_id, payment_status, created_at desc);

create index if not exists creator_subscription_payment_creator_status_created_idx
  on public.creator_subscription_payment (creator_id, payment_status, created_at desc);

alter table public.creator_subscription_payment enable row level security;

revoke all privileges on table public.creator_subscription_payment from public;
revoke all privileges on table public.creator_subscription_payment from anon;
revoke all privileges on table public.creator_subscription_payment from authenticated;
grant select, insert, update, delete on table public.creator_subscription_payment to service_role;
