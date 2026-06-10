-- 익명 후원 채팅 메시지의 작성자 표기를 후원 랭킹과 통일한다.
-- 기존에는 익명 후원 시 live_message.metadata.donorNickname 을 '익명' 으로 박아 넣어
-- 채팅창에서는 "익명", 랭킹에서는 "익명의 너구리"로 불일치했다.
-- 이제 랭킹과 동일한 public.anonymous_donor_alias(donor_id) 를 써서 양쪽을 일치시킨다.
-- (이 변경 이전에 쌓인 익명 후원 메시지는 metadata 가 고정값이라 과거 "익명" 그대로 남는다.)
-- 본 함수는 머니 경로다. donorNickname case 한 줄만 변경했고 나머지 로직은 동일하다.

create or replace function public.send_live_donation(
  p_actor_user_id uuid,
  p_broadcast_id uuid,
  p_amount integer,
  p_message text default '',
  p_is_anonymous boolean default false,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_idempotency_key text := btrim(coalesce(p_idempotency_key, ''));
  v_message text := btrim(coalesce(p_message, ''));
  v_broadcast record;
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

  if p_broadcast_id is null then
    raise sqlstate 'PX400' using message = 'invalid broadcast';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise sqlstate 'PX400' using message = 'invalid donation amount';
  end if;

  if char_length(v_message) > 300 then
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

  select
    broadcast.id,
    broadcast.creator_id
  into v_broadcast
  from public.live_broadcast as broadcast
  where broadcast.id = p_broadcast_id
    and broadcast.ended_at is null;

  if not found then
    raise sqlstate 'PX404' using message = 'active live broadcast not found';
  end if;

  if v_broadcast.creator_id = p_actor_user_id then
    raise sqlstate 'PX400' using message = 'creator cannot donate to self';
  end if;

  select *
  into v_setting
  from public.creator_studio_setting as setting
  where setting.creator_id = v_broadcast.creator_id;

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
      'broadcastId', p_broadcast_id,
      'creatorId', v_broadcast.creator_id
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
    p_broadcast_id,
    v_broadcast.creator_id,
    p_actor_user_id,
    v_transaction_id,
    p_amount,
    v_message,
    coalesce(p_is_anonymous, false)
  )
  returning id into v_donation_id;

  insert into public.live_message (
    broadcast_id,
    sender_id,
    message_type,
    content,
    donation_id,
    metadata
  )
  values (
    p_broadcast_id,
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

revoke execute on function public.send_live_donation(uuid, uuid, integer, text, boolean, text) from public;
revoke execute on function public.send_live_donation(uuid, uuid, integer, text, boolean, text) from anon;
revoke execute on function public.send_live_donation(uuid, uuid, integer, text, boolean, text) from authenticated;
grant execute on function public.send_live_donation(uuid, uuid, integer, text, boolean, text) to service_role;
