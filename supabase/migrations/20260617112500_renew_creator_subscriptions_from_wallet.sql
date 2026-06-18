-- Renew active creator subscriptions from viewer wallet points.

create extension if not exists pg_cron;

create or replace function public.renew_due_creator_subscriptions(
  p_limit integer default 100
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_now timestamp with time zone := now();
  v_amount integer := 4900;
  v_subscription public.creator_subscription%rowtype;
  v_wallet public.wallet_account%rowtype;
  v_wallet_transaction_id uuid;
  v_balance_after integer;
  v_idempotency_key text;
  v_order_id text;
  v_next_end_at timestamp with time zone;
  v_processed_count integer := 0;
  v_succeeded_count integer := 0;
  v_failed_count integer := 0;
begin
  for v_subscription in
    select *
    from public.creator_subscription as subscription
    where subscription.status = 'active'::public.creator_subscription_status
      and subscription.end_at <= v_now
    order by subscription.end_at asc
    limit greatest(coalesce(p_limit, 100), 1)
    for update skip locked
  loop
    v_processed_count := v_processed_count + 1;
    v_idempotency_key := 'subscription-renewal-' || v_subscription.id::text || '-' || extract(epoch from v_subscription.end_at)::bigint::text;
    v_order_id := 'wallet-subscription-renewal-' || replace(v_subscription.id::text, '-', '') || '-' || extract(epoch from v_subscription.end_at)::bigint::text;

    perform pg_advisory_xact_lock(hashtextextended(v_subscription.creator_id::text || ':' || v_subscription.subscriber_id::text, 0));
    perform pg_advisory_xact_lock(hashtextextended(v_subscription.subscriber_id::text || ':wallet', 0));

    insert into public.wallet_account (user_id)
    values (v_subscription.subscriber_id)
    on conflict (user_id) do nothing;

    select *
    into v_wallet
    from public.wallet_account as wallet
    where wallet.user_id = v_subscription.subscriber_id
    for update;

    if v_wallet.balance_amount < v_amount then
      update public.creator_subscription as subscription
      set status = 'expired'::public.creator_subscription_status
      where subscription.id = v_subscription.id;

      insert into public.creator_subscription_payment (
        creator_id,
        subscriber_id,
        subscription_id,
        payment_status,
        amount,
        order_id,
        idempotency_key,
        provider,
        failure_code,
        failure_message,
        metadata,
        requested_at,
        failed_at
      )
      values (
        v_subscription.creator_id,
        v_subscription.subscriber_id,
        v_subscription.id,
        'failed'::public.creator_subscription_payment_status,
        v_amount,
        v_order_id,
        v_idempotency_key,
        'wallet',
        'insufficient_wallet_balance',
        'insufficient wallet balance for subscription renewal',
        jsonb_build_object(
          'subscriptionId', v_subscription.id,
          'balanceAmount', v_wallet.balance_amount,
          'paymentType', 'creator_subscription_renewal'
        ),
        v_now,
        v_now
      )
      on conflict (idempotency_key) do nothing;

      v_failed_count := v_failed_count + 1;
    else
      v_next_end_at := v_subscription.end_at + interval '1 month';
      v_balance_after := v_wallet.balance_amount - v_amount;

      update public.wallet_account as wallet
      set balance_amount = v_balance_after
      where wallet.user_id = v_subscription.subscriber_id;

      update public.creator_subscription as subscription
      set
        end_at = v_next_end_at,
        total_months = subscription.total_months + 1,
        status = 'active'::public.creator_subscription_status
      where subscription.id = v_subscription.id
      returning * into v_subscription;

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
        v_subscription.subscriber_id,
        'subscription_spend'::public.wallet_transaction_type,
        'succeeded'::public.wallet_transaction_status,
        -v_amount,
        v_balance_after,
        v_idempotency_key,
        jsonb_build_object(
          'creatorId', v_subscription.creator_id,
          'subscriptionId', v_subscription.id,
          'paymentType', 'creator_subscription_renewal'
        )
      )
      returning id into v_wallet_transaction_id;

      insert into public.creator_subscription_payment (
        creator_id,
        subscriber_id,
        subscription_id,
        payment_status,
        amount,
        order_id,
        idempotency_key,
        provider,
        metadata,
        requested_at,
        approved_at
      )
      values (
        v_subscription.creator_id,
        v_subscription.subscriber_id,
        v_subscription.id,
        'succeeded'::public.creator_subscription_payment_status,
        v_amount,
        v_order_id,
        v_idempotency_key,
        'wallet',
        jsonb_build_object(
          'walletTransactionId', v_wallet_transaction_id,
          'subscriptionId', v_subscription.id,
          'paymentType', 'creator_subscription_renewal'
        ),
        v_now,
        v_now
      )
      on conflict (idempotency_key) do nothing;

      v_succeeded_count := v_succeeded_count + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'processedCount', v_processed_count,
    'succeededCount', v_succeeded_count,
    'failedCount', v_failed_count
  );
end;
$function$;

revoke execute on function public.renew_due_creator_subscriptions(integer) from public;
revoke execute on function public.renew_due_creator_subscriptions(integer) from anon;
revoke execute on function public.renew_due_creator_subscriptions(integer) from authenticated;
grant execute on function public.renew_due_creator_subscriptions(integer) to service_role;

select cron.schedule(
  'renew-due-creator-subscriptions',
  '*/15 * * * *',
  $$select public.renew_due_creator_subscriptions(100);$$
);
