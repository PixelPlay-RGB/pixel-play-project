-- 후원 메시지 길이 제한을 300 → 100자로 강화 (팀 QA 정책: 후원 메시지는 강조 한 줄).
-- 적용 시점 기존 데이터 최대 길이 58자라 CHECK 축소 시 위반 없음(NOT VALID 불필요).

alter table public.donation drop constraint donation_message_length;
alter table public.donation
  add constraint donation_message_length check (char_length(message) <= 100);

create or replace function public.send_live_donation_v2(p_actor_user_id uuid, p_creator_id uuid, p_amount integer, p_message text default ''::text, p_is_anonymous boolean default false, p_idempotency_key text default null::text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_idempotency_key text := btrim(coalesce(p_idempotency_key, ''));
  v_message text := btrim(coalesce(p_message, ''));
  v_broadcast_id uuid;
  v_setting public.creator_studio_setting%rowtype;
  v_wallet public.wallet_account%rowtype;
  v_existing_transaction public.wallet_transaction%rowtype;
  v_existing_donation public.donation%rowtype;
  v_transaction_id uuid;
  v_donation_id uuid;
  v_balance_after integer;
  v_donor record;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  if p_creator_id is null then
    raise sqlstate 'PX400' using message = 'invalid creator';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise sqlstate 'PX400' using message = 'invalid donation amount';
  end if;

  if char_length(v_message) > 100 then
    raise sqlstate 'PX400' using message = 'invalid donation message';
  end if;

  if v_idempotency_key = '' then
    raise sqlstate 'PX400' using message = 'idempotency key required';
  end if;

  select
    donor.nickname,
    donor.photo_url
  into v_donor
  from public."user" as donor
  where donor.id = p_actor_user_id;

  if not found then
    raise sqlstate 'PX404' using message = 'donor not found';
  end if;

  select *
  into v_existing_transaction
  from public.wallet_transaction as transaction
  where transaction.idempotency_key = v_idempotency_key;

  if found then
    if v_existing_transaction.user_id <> p_actor_user_id
      or v_existing_transaction.transaction_type <> 'donation_spend'::public.wallet_transaction_type
      or v_existing_transaction.amount_delta <> -p_amount then
      raise sqlstate 'PX409' using message = 'idempotency key conflict';
    end if;

    select *
    into v_existing_donation
    from public.donation as donation
    where donation.wallet_transaction_id = v_existing_transaction.id;

    if not found then
      raise sqlstate 'PX409' using message = 'donation idempotency state conflict';
    end if;

    return jsonb_build_object(
      'donationId', v_existing_donation.id,
      'transactionId', v_existing_transaction.id,
      'balanceAfter', v_existing_transaction.balance_after,
      'replayed', true
    );
  end if;

  if not exists (
    select 1
    from public."user" as creator
    where creator.id = p_creator_id
  ) then
    raise sqlstate 'PX404' using message = 'creator not found';
  end if;

  if p_creator_id = p_actor_user_id then
    raise sqlstate 'PX400' using message = 'creator cannot donate to self';
  end if;

  -- 활성 방송이 있으면 후원을 방송에 귀속시키고, 없으면 채널 후원으로 기록한다.
  select broadcast.id
  into v_broadcast_id
  from public.live_broadcast as broadcast
  where broadcast.creator_id = p_creator_id
    and broadcast.ended_at is null
  order by broadcast.started_at desc
  limit 1;

  select *
  into v_setting
  from public.creator_studio_setting as setting
  where setting.creator_id = p_creator_id;

  if coalesce(v_setting.donation_enabled, true) = false then
    raise sqlstate 'PX403' using message = 'donation disabled';
  end if;

  if p_amount < coalesce(v_setting.donation_min_amount, 1000) then
    raise sqlstate 'PX400' using message = 'donation amount too low';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_actor_user_id::text || ':wallet', 0));

  insert into public.wallet_account (user_id)
  values (p_actor_user_id)
  on conflict (user_id) do nothing;

  select *
  into v_wallet
  from public.wallet_account as wallet
  where wallet.user_id = p_actor_user_id
  for update;

  if v_wallet.balance_amount < p_amount then
    raise sqlstate 'PX402' using message = 'insufficient wallet balance';
  end if;

  v_balance_after := v_wallet.balance_amount - p_amount;

  update public.wallet_account as wallet
  set balance_amount = v_balance_after
  where wallet.user_id = p_actor_user_id;

  insert into public.wallet_transaction (
    user_id,
    transaction_type,
    transaction_status,
    amount_delta,
    balance_after,
    idempotency_key,
    metadata
  )
  values (
    p_actor_user_id,
    'donation_spend'::public.wallet_transaction_type,
    'succeeded'::public.wallet_transaction_status,
    -p_amount,
    v_balance_after,
    v_idempotency_key,
    jsonb_build_object(
      'broadcastId', v_broadcast_id,
      'creatorId', p_creator_id
    )
  )
  returning id into v_transaction_id;

  insert into public.donation (
    broadcast_id,
    creator_id,
    donor_id,
    wallet_transaction_id,
    amount,
    message,
    is_anonymous
  )
  values (
    v_broadcast_id,
    p_creator_id,
    p_actor_user_id,
    v_transaction_id,
    p_amount,
    v_message,
    coalesce(p_is_anonymous, false)
  )
  returning id into v_donation_id;

  insert into public.live_message (
    broadcast_id,
    creator_id,
    sender_id,
    message_type,
    content,
    donation_id,
    metadata
  )
  values (
    v_broadcast_id,
    p_creator_id,
    case when coalesce(p_is_anonymous, false) then null else p_actor_user_id end,
    'donation'::public.live_message_type,
    v_message,
    v_donation_id,
    jsonb_build_object(
      'donationId', v_donation_id,
      'amount', p_amount,
      'donorNickname', case when coalesce(p_is_anonymous, false) then coalesce(public.anonymous_donor_alias(p_actor_user_id), '익명') else v_donor.nickname end,
      'donorPhotoUrl', case when coalesce(p_is_anonymous, false) then null else v_donor.photo_url end,
      'isAnonymous', coalesce(p_is_anonymous, false)
    )
  );

  return jsonb_build_object(
    'donationId', v_donation_id,
    'transactionId', v_transaction_id,
    'balanceAfter', v_balance_after,
    'replayed', false
  );
end;
$function$;
