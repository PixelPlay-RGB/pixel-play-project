-- Allow prepared wallet charge orders to be confirmed in-place.
create or replace function public.confirm_wallet_charge(
  p_actor_user_id uuid,
  p_amount integer,
  p_idempotency_key text,
  p_payment_key text default null,
  p_order_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_idempotency_key text := btrim(coalesce(p_idempotency_key, ''));
  v_payment_key text := nullif(btrim(coalesce(p_payment_key, '')), '');
  v_order_id text := nullif(btrim(coalesce(p_order_id, '')), '');
  v_wallet public.wallet_account%rowtype;
  v_existing_transaction public.wallet_transaction%rowtype;
  v_transaction_id uuid;
  v_balance_after integer;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise sqlstate 'PX400' using message = 'invalid charge amount';
  end if;

  if v_idempotency_key = '' then
    raise sqlstate 'PX400' using message = 'idempotency key required';
  end if;

  if p_metadata is not null and jsonb_typeof(p_metadata) <> 'object' then
    raise sqlstate 'PX400' using message = 'invalid metadata';
  end if;

  select *
  into v_existing_transaction
  from public.wallet_transaction as transaction
  where transaction.idempotency_key = v_idempotency_key
  for update;

  if found then
    if v_existing_transaction.user_id <> p_actor_user_id
      or v_existing_transaction.transaction_type <> 'charge'::public.wallet_transaction_type
      or v_existing_transaction.amount_delta <> p_amount then
      raise sqlstate 'PX409' using message = 'idempotency key conflict';
    end if;

    if v_existing_transaction.payment_key is not null
      and v_payment_key is not null
      and v_existing_transaction.payment_key <> v_payment_key then
      raise sqlstate 'PX409' using message = 'payment key conflict';
    end if;

    if v_existing_transaction.order_id is not null
      and v_order_id is not null
      and v_existing_transaction.order_id <> v_order_id then
      raise sqlstate 'PX409' using message = 'order id conflict';
    end if;

    if v_existing_transaction.transaction_status = 'succeeded'::public.wallet_transaction_status then
      return jsonb_build_object(
        'transactionId', v_existing_transaction.id,
        'balanceAfter', v_existing_transaction.balance_after,
        'replayed', true
      );
    end if;

    if v_existing_transaction.transaction_status <> 'pending'::public.wallet_transaction_status then
      raise sqlstate 'PX409' using message = 'charge order is not pending';
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

    v_balance_after := v_wallet.balance_amount + p_amount;

    update public.wallet_account as wallet
    set balance_amount = v_balance_after
    where wallet.user_id = p_actor_user_id;

    update public.wallet_transaction as transaction
    set
      transaction_status = 'succeeded'::public.wallet_transaction_status,
      balance_after = v_balance_after,
      payment_key = coalesce(v_payment_key, transaction.payment_key),
      order_id = coalesce(v_order_id, transaction.order_id),
      metadata = coalesce(transaction.metadata, '{}'::jsonb) || coalesce(p_metadata, '{}'::jsonb)
    where transaction.id = v_existing_transaction.id
    returning transaction.id into v_transaction_id;

    return jsonb_build_object(
      'transactionId', v_transaction_id,
      'balanceAfter', v_balance_after,
      'replayed', false
    );
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

  v_balance_after := v_wallet.balance_amount + p_amount;

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
    payment_key,
    order_id,
    metadata
  )
  values (
    p_actor_user_id,
    'charge'::public.wallet_transaction_type,
    'succeeded'::public.wallet_transaction_status,
    p_amount,
    v_balance_after,
    v_idempotency_key,
    v_payment_key,
    v_order_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_transaction_id;

  return jsonb_build_object(
    'transactionId', v_transaction_id,
    'balanceAfter', v_balance_after,
    'replayed', false
  );
end;
$function$;

revoke execute on function public.confirm_wallet_charge(uuid, integer, text, text, text, jsonb) from public;
revoke execute on function public.confirm_wallet_charge(uuid, integer, text, text, text, jsonb) from anon;
revoke execute on function public.confirm_wallet_charge(uuid, integer, text, text, text, jsonb) from authenticated;
grant execute on function public.confirm_wallet_charge(uuid, integer, text, text, text, jsonb) to service_role;
