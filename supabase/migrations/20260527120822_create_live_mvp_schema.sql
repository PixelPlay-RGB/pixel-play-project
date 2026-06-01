-- Live MVP schema foundation.
-- Scope: creator settings, live broadcasts, live chat, follows/rules, wallet, donation, and polls.

do $$
begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'live_chat_scope') then
    create type public.live_chat_scope as enum ('authenticated', 'follower', 'manager');
  end if;

  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'live_message_type') then
    create type public.live_message_type as enum ('chat', 'moderation_notice', 'donation');
  end if;

  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'wallet_transaction_type') then
    create type public.wallet_transaction_type as enum ('charge', 'donation_spend', 'refund');
  end if;

  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'wallet_transaction_status') then
    create type public.wallet_transaction_status as enum ('pending', 'succeeded', 'failed', 'canceled');
  end if;
end;
$$;

create table if not exists public.creator_studio_setting (
  creator_id uuid primary key,
  default_title text not null default '',
  default_tags text[] not null default '{}'::text[],
  chat_scope public.live_chat_scope not null default 'authenticated'::public.live_chat_scope,
  follower_wait_seconds integer not null default 0,
  slow_mode_enabled boolean not null default false,
  slow_mode_seconds integer not null default 3,
  link_blocked boolean not null default true,
  forbidden_words text[] not null default '{}'::text[],
  chat_rule_text text not null default '',
  chat_rule_version integer not null default 1,
  donation_enabled boolean not null default true,
  donation_min_amount integer not null default 1000,
  donation_amount_visible boolean not null default true,
  donation_alert_enabled boolean not null default true,
  alert_sound_enabled boolean not null default true,
  alert_volume integer not null default 32,
  tts_enabled boolean not null default true,
  tts_rate numeric(3, 2) not null default 1.00,
  settlement_demo jsonb not null default '{"status":"ready","totalAmount":99999,"bankName":"Demo Bank","accountHolder":"PixelPlay Creator"}'::jsonb,
  stream_key_version integer not null default 1,
  chat_overlay_version integer not null default 1,
  donation_alert_version integer not null default 1,
  created_at timestamp with time zone not null default now(),
  modified_at timestamp with time zone not null default now(),
  constraint creator_studio_setting_creator_id_fkey foreign key (creator_id) references public."user"(id) on delete cascade,
  constraint creator_studio_setting_default_title_length check (char_length(default_title) <= 100),
  constraint creator_studio_setting_default_tags_limit check (coalesce(array_length(default_tags, 1), 0) <= 5),
  constraint creator_studio_setting_follower_wait_seconds_value check (
    follower_wait_seconds in (0, 300, 600, 1800, 3600, 86400, 604800, 2592000, 5184000, 7776000, 10368000, 12960000, 15552000)
  ),
  constraint creator_studio_setting_slow_mode_seconds_value check (slow_mode_seconds in (3, 5, 10, 30, 60, 120, 300)),
  constraint creator_studio_setting_forbidden_words_limit check (coalesce(array_length(forbidden_words, 1), 0) <= 100),
  constraint creator_studio_setting_chat_rule_text_length check (char_length(chat_rule_text) <= 300),
  constraint creator_studio_setting_chat_rule_version_positive check (chat_rule_version > 0),
  constraint creator_studio_setting_donation_min_amount_range check (donation_min_amount >= 1000 and donation_min_amount <= 1000000),
  constraint creator_studio_setting_alert_volume_range check (alert_volume >= 0 and alert_volume <= 100),
  constraint creator_studio_setting_tts_rate_range check (tts_rate >= 0.50 and tts_rate <= 2.00),
  constraint creator_studio_setting_settlement_demo_object check (jsonb_typeof(settlement_demo) = 'object'),
  constraint creator_studio_setting_token_versions_positive check (
    stream_key_version > 0
    and chat_overlay_version > 0
    and donation_alert_version > 0
  )
);

create table if not exists public.live_broadcast (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null,
  title text not null,
  tags text[] not null default '{}'::text[],
  thumbnail_url text,
  started_at timestamp with time zone not null default now(),
  ended_at timestamp with time zone,
  current_viewer_count integer not null default 0,
  peak_viewer_count integer not null default 0,
  chat_message_count integer not null default 0,
  donation_count integer not null default 0,
  donation_amount_total integer not null default 0,
  created_at timestamp with time zone not null default now(),
  modified_at timestamp with time zone not null default now(),
  constraint live_broadcast_creator_id_fkey foreign key (creator_id) references public."user"(id) on delete cascade,
  constraint live_broadcast_title_length check (char_length(btrim(title)) between 1 and 100),
  constraint live_broadcast_tags_limit check (coalesce(array_length(tags, 1), 0) <= 5),
  constraint live_broadcast_ended_at_after_started_at check (ended_at is null or ended_at >= started_at),
  constraint live_broadcast_current_viewer_count_non_negative check (current_viewer_count >= 0),
  constraint live_broadcast_peak_viewer_count_non_negative check (peak_viewer_count >= 0),
  constraint live_broadcast_chat_message_count_non_negative check (chat_message_count >= 0),
  constraint live_broadcast_donation_count_non_negative check (donation_count >= 0),
  constraint live_broadcast_donation_amount_total_non_negative check (donation_amount_total >= 0)
);

create table if not exists public.live_message (
  id uuid primary key default gen_random_uuid(),
  broadcast_id uuid not null,
  sender_id uuid,
  message_type public.live_message_type not null default 'chat'::public.live_message_type,
  content text not null,
  donation_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint live_message_broadcast_id_fkey foreign key (broadcast_id) references public.live_broadcast(id) on delete cascade,
  constraint live_message_sender_id_fkey foreign key (sender_id) references public."user"(id) on delete set null,
  constraint live_message_sender_required_for_chat check (
    message_type <> 'chat'::public.live_message_type
    or sender_id is not null
  ),
  constraint live_message_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint live_message_donation_state check (
    (
      message_type = 'donation'::public.live_message_type
      and donation_id is not null
    )
    or (
      message_type <> 'donation'::public.live_message_type
      and donation_id is null
    )
  ),
  constraint live_message_content_length check (
    (
      message_type = 'donation'::public.live_message_type
      and char_length(content) <= 300
    )
    or (
      message_type <> 'donation'::public.live_message_type
      and char_length(btrim(content)) between 1 and 2000
    )
  )
);

create table if not exists public.viewer_creator_relation (
  viewer_id uuid not null,
  creator_id uuid not null,
  followed_at timestamp with time zone,
  chat_rule_accepted_version integer,
  chat_rule_accepted_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  modified_at timestamp with time zone not null default now(),
  constraint viewer_creator_relation_pkey primary key (viewer_id, creator_id),
  constraint viewer_creator_relation_viewer_id_fkey foreign key (viewer_id) references public."user"(id) on delete cascade,
  constraint viewer_creator_relation_creator_id_fkey foreign key (creator_id) references public."user"(id) on delete cascade,
  constraint viewer_creator_relation_not_self check (viewer_id <> creator_id),
  constraint viewer_creator_relation_chat_rule_state check (
    (
      chat_rule_accepted_version is null
      and chat_rule_accepted_at is null
    )
    or (
      chat_rule_accepted_version is not null
      and chat_rule_accepted_version > 0
      and chat_rule_accepted_at is not null
    )
  )
);

create table if not exists public.wallet_account (
  user_id uuid primary key,
  balance_amount integer not null default 0,
  created_at timestamp with time zone not null default now(),
  modified_at timestamp with time zone not null default now(),
  constraint wallet_account_user_id_fkey foreign key (user_id) references public."user"(id) on delete cascade,
  constraint wallet_account_balance_amount_non_negative check (balance_amount >= 0)
);

create table if not exists public.wallet_transaction (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  transaction_type public.wallet_transaction_type not null,
  transaction_status public.wallet_transaction_status not null default 'pending'::public.wallet_transaction_status,
  amount_delta integer not null,
  balance_after integer,
  idempotency_key text,
  payment_key text,
  order_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  modified_at timestamp with time zone not null default now(),
  constraint wallet_transaction_user_id_fkey foreign key (user_id) references public."user"(id) on delete cascade,
  constraint wallet_transaction_amount_delta_non_zero check (amount_delta <> 0),
  constraint wallet_transaction_balance_after_non_negative check (balance_after is null or balance_after >= 0),
  constraint wallet_transaction_succeeded_has_balance_after check (
    transaction_status <> 'succeeded'::public.wallet_transaction_status
    or balance_after is not null
  ),
  constraint wallet_transaction_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.donation (
  id uuid primary key default gen_random_uuid(),
  broadcast_id uuid not null,
  creator_id uuid not null,
  donor_id uuid not null,
  wallet_transaction_id uuid not null,
  amount integer not null,
  message text not null default '',
  is_anonymous boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint donation_broadcast_id_fkey foreign key (broadcast_id) references public.live_broadcast(id) on delete restrict,
  constraint donation_creator_id_fkey foreign key (creator_id) references public."user"(id) on delete cascade,
  constraint donation_donor_id_fkey foreign key (donor_id) references public."user"(id) on delete cascade,
  constraint donation_wallet_transaction_id_fkey foreign key (wallet_transaction_id) references public.wallet_transaction(id) on delete restrict,
  constraint donation_wallet_transaction_id_key unique (wallet_transaction_id),
  constraint donation_amount_positive check (amount > 0),
  constraint donation_message_length check (char_length(message) <= 300),
  constraint donation_donor_not_creator check (donor_id <> creator_id)
);

alter table public.live_message
  add constraint live_message_donation_id_fkey foreign key (donation_id) references public.donation(id) on delete cascade,
  add constraint live_message_donation_id_key unique (donation_id);

create table if not exists public.live_poll (
  id uuid primary key default gen_random_uuid(),
  broadcast_id uuid not null,
  title text not null,
  options jsonb not null,
  ends_at timestamp with time zone,
  ended_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  modified_at timestamp with time zone not null default now(),
  constraint live_poll_broadcast_id_fkey foreign key (broadcast_id) references public.live_broadcast(id) on delete cascade,
  constraint live_poll_title_length check (char_length(btrim(title)) between 1 and 80),
  constraint live_poll_options_array check (
    jsonb_typeof(options) = 'array'
    and jsonb_array_length(options) between 2 and 5
  ),
  constraint live_poll_ends_at_after_created_at check (ends_at is null or ends_at >= created_at),
  constraint live_poll_ended_at_after_created_at check (ended_at is null or ended_at >= created_at)
);

create table if not exists public.live_poll_vote (
  poll_id uuid not null,
  voter_id uuid not null,
  option_id text not null,
  created_at timestamp with time zone not null default now(),
  constraint live_poll_vote_pkey primary key (poll_id, voter_id),
  constraint live_poll_vote_poll_id_fkey foreign key (poll_id) references public.live_poll(id) on delete cascade,
  constraint live_poll_vote_voter_id_fkey foreign key (voter_id) references public."user"(id) on delete cascade,
  constraint live_poll_vote_option_id_length check (char_length(btrim(option_id)) between 1 and 64)
);

create index if not exists live_broadcast_active_started_at_idx
  on public.live_broadcast using btree (started_at desc)
  where ended_at is null;

create index if not exists live_broadcast_creator_started_at_idx
  on public.live_broadcast using btree (creator_id, started_at desc);

create index if not exists live_broadcast_tags_idx
  on public.live_broadcast using gin (tags);

create index if not exists live_message_broadcast_created_at_idx
  on public.live_message using btree (broadcast_id, created_at desc);

create index if not exists live_message_sender_created_at_idx
  on public.live_message using btree (sender_id, created_at desc)
  where sender_id is not null;

create index if not exists viewer_creator_relation_creator_followed_idx
  on public.viewer_creator_relation using btree (creator_id, followed_at desc)
  where followed_at is not null;

create index if not exists viewer_creator_relation_viewer_followed_idx
  on public.viewer_creator_relation using btree (viewer_id, followed_at desc)
  where followed_at is not null;

create index if not exists wallet_transaction_user_created_at_idx
  on public.wallet_transaction using btree (user_id, created_at desc);

create unique index if not exists wallet_transaction_idempotency_key_idx
  on public.wallet_transaction using btree (idempotency_key)
  where idempotency_key is not null;

create unique index if not exists wallet_transaction_payment_key_idx
  on public.wallet_transaction using btree (payment_key)
  where payment_key is not null;

create unique index if not exists wallet_transaction_order_id_idx
  on public.wallet_transaction using btree (order_id)
  where order_id is not null;

create index if not exists donation_broadcast_created_at_idx
  on public.donation using btree (broadcast_id, created_at desc);

create index if not exists donation_creator_created_at_idx
  on public.donation using btree (creator_id, created_at desc);

create index if not exists donation_donor_created_at_idx
  on public.donation using btree (donor_id, created_at desc);

create index if not exists live_poll_broadcast_created_at_idx
  on public.live_poll using btree (broadcast_id, created_at desc);

create index if not exists live_poll_active_broadcast_idx
  on public.live_poll using btree (broadcast_id, created_at desc)
  where ended_at is null;

create index if not exists live_poll_vote_voter_created_at_idx
  on public.live_poll_vote using btree (voter_id, created_at desc);

alter table public.creator_studio_setting enable row level security;
alter table public.live_broadcast enable row level security;
alter table public.live_message enable row level security;
alter table public.viewer_creator_relation enable row level security;
alter table public.wallet_account enable row level security;
alter table public.wallet_transaction enable row level security;
alter table public.donation enable row level security;
alter table public.live_poll enable row level security;
alter table public.live_poll_vote enable row level security;

drop trigger if exists set_creator_studio_setting_modified_at on public.creator_studio_setting;
create trigger set_creator_studio_setting_modified_at
before update on public.creator_studio_setting
for each row execute function public.update_modified_column();

drop trigger if exists set_live_broadcast_modified_at on public.live_broadcast;
create trigger set_live_broadcast_modified_at
before update on public.live_broadcast
for each row execute function public.update_modified_column();

drop trigger if exists set_viewer_creator_relation_modified_at on public.viewer_creator_relation;
create trigger set_viewer_creator_relation_modified_at
before update on public.viewer_creator_relation
for each row execute function public.update_modified_column();

drop trigger if exists set_wallet_account_modified_at on public.wallet_account;
create trigger set_wallet_account_modified_at
before update on public.wallet_account
for each row execute function public.update_modified_column();

drop trigger if exists set_wallet_transaction_modified_at on public.wallet_transaction;
create trigger set_wallet_transaction_modified_at
before update on public.wallet_transaction
for each row execute function public.update_modified_column();

drop trigger if exists set_live_poll_modified_at on public.live_poll;
create trigger set_live_poll_modified_at
before update on public.live_poll
for each row execute function public.update_modified_column();

create or replace function public.increment_live_broadcast_message_count()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.message_type = 'chat'::public.live_message_type then
    update public.live_broadcast
    set chat_message_count = chat_message_count + 1
    where id = new.broadcast_id;
  end if;

  return new;
end;
$function$;

create or replace function public.increment_live_broadcast_donation_stats()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  update public.live_broadcast
  set
    donation_count = donation_count + 1,
    donation_amount_total = donation_amount_total + new.amount
  where id = new.broadcast_id;

  return new;
end;
$function$;

drop trigger if exists increment_live_broadcast_message_count_on_live_message on public.live_message;
create trigger increment_live_broadcast_message_count_on_live_message
after insert on public.live_message
for each row execute function public.increment_live_broadcast_message_count();

drop trigger if exists increment_live_broadcast_donation_stats_on_donation on public.donation;
create trigger increment_live_broadcast_donation_stats_on_donation
after insert on public.donation
for each row execute function public.increment_live_broadcast_donation_stats();

revoke execute on function public.increment_live_broadcast_message_count() from public;
revoke execute on function public.increment_live_broadcast_message_count() from anon;
revoke execute on function public.increment_live_broadcast_message_count() from authenticated;
grant execute on function public.increment_live_broadcast_message_count() to service_role;

revoke execute on function public.increment_live_broadcast_donation_stats() from public;
revoke execute on function public.increment_live_broadcast_donation_stats() from anon;
revoke execute on function public.increment_live_broadcast_donation_stats() from authenticated;
grant execute on function public.increment_live_broadcast_donation_stats() to service_role;
