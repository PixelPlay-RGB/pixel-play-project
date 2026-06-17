-- 크리에이터 구독을 Toss 결제 대신 후원 지갑 포인트 차감으로 처리한다.

drop function if exists public.subscribe_creator(uuid, uuid);

create or replace function public.subscribe_creator(
  p_actor_user_id uuid,
  p_creator_id uuid,
  p_idempotency_key text default null
)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_now timestamp with time zone := now();
  v_amount integer := 4900;
  v_idempotency_key text := btrim(coalesce(p_idempotency_key, ''));
  v_order_id text;
  v_subscription public.creator_subscription%rowtype;
  v_existing_payment public.creator_subscription_payment%rowtype;
  v_wallet public.wallet_account%rowtype;
  v_was_active boolean := false;
  v_was_canceled_entitled boolean := false;
  v_wallet_transaction_id uuid;
  v_balance_after integer;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  if p_creator_id is null then
    raise sqlstate 'PX400' using message = 'invalid creator';
  end if;

  if p_actor_user_id = p_creator_id then
    raise sqlstate 'PX400' using message = 'cannot subscribe self';
  end if;

  if v_idempotency_key = '' then
    v_idempotency_key := gen_random_uuid()::text;
  end if;

  v_order_id := 'wallet-subscription-' || replace(v_idempotency_key, '-', '');

  if not exists (
    select 1
    from public."user" as creator
    where creator.id = p_creator_id
  ) then
    raise sqlstate 'PX404' using message = 'creator not found';
  end if;

  if not exists (
    select 1
    from public."user" as subscriber
    where subscriber.id = p_actor_user_id
  ) then
    raise sqlstate 'PX404' using message = 'subscriber not found';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_creator_id::text || ':' || p_actor_user_id::text, 0));

  select *
  into v_subscription
  from public.creator_subscription as subscription
  where subscription.creator_id = p_creator_id
    and subscription.subscriber_id = p_actor_user_id;

  v_was_active := coalesce(
    v_subscription.status = 'active'::public.creator_subscription_status
      and v_subscription.end_at > v_now,
    false
  );
  v_was_canceled_entitled := coalesce(
    v_subscription.status = 'canceled'::public.creator_subscription_status
      and v_subscription.end_at > v_now,
    false
  );

  if v_was_active then
    null;
  elsif v_was_canceled_entitled then
    update public.creator_subscription
    set status = 'active'::public.creator_subscription_status
    where id = v_subscription.id
    returning * into v_subscription;
  else
    select *
    into v_existing_payment
    from public.creator_subscription_payment as payment
    where payment.idempotency_key = v_idempotency_key;

    if found then
      if v_existing_payment.creator_id <> p_creator_id
        or v_existing_payment.subscriber_id <> p_actor_user_id
        or v_existing_payment.amount <> v_amount
        or v_existing_payment.provider <> 'wallet'
        or v_existing_payment.payment_status <> 'succeeded'::public.creator_subscription_payment_status
        or v_existing_payment.subscription_id is null then
        raise sqlstate 'PX409' using message = 'idempotency key conflict';
      end if;

      select *
      into v_subscription
      from public.creator_subscription as subscription
      where subscription.id = v_existing_payment.subscription_id;
    else
      perform pg_advisory_xact_lock(hashtextextended(p_actor_user_id::text || ':wallet', 0));

      insert into public.wallet_account (user_id)
      values (p_actor_user_id)
      on conflict (user_id) do nothing;

      select *
      into v_wallet
      from public.wallet_account as wallet
      where wallet.user_id = p_actor_user_id
      for update;

      if v_wallet.balance_amount < v_amount then
        raise sqlstate 'PX402' using message = 'insufficient wallet balance';
      end if;

      insert into public.creator_subscription (
        creator_id,
        subscriber_id,
        started_at,
        end_at,
        total_months,
        status
      )
      values (
        p_creator_id,
        p_actor_user_id,
        v_now,
        v_now + interval '1 month',
        1,
        'active'::public.creator_subscription_status
      )
      on conflict (creator_id, subscriber_id)
      do update set
        started_at = v_now,
        end_at = v_now + interval '1 month',
        total_months = public.creator_subscription.total_months + 1,
        status = 'active'::public.creator_subscription_status
      returning * into v_subscription;

      v_balance_after := v_wallet.balance_amount - v_amount;

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
        'subscription_spend'::public.wallet_transaction_type,
        'succeeded'::public.wallet_transaction_status,
        -v_amount,
        v_balance_after,
        v_idempotency_key,
        jsonb_build_object(
          'creatorId', p_creator_id,
          'subscriptionId', v_subscription.id,
          'paymentType', 'creator_subscription'
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
        p_creator_id,
        p_actor_user_id,
        v_subscription.id,
        'succeeded'::public.creator_subscription_payment_status,
        v_amount,
        v_order_id,
        v_idempotency_key,
        'wallet',
        jsonb_build_object(
          'walletTransactionId', v_wallet_transaction_id,
          'subscriptionId', v_subscription.id
        ),
        v_now,
        v_now
      );
    end if;
  end if;

  return jsonb_build_object(
    'id', v_subscription.id,
    'isSubscribed', v_subscription.status = 'active'::public.creator_subscription_status and v_subscription.end_at > v_now,
    'alreadySubscribed', v_was_active,
    'startedAt', v_subscription.started_at,
    'endAt', v_subscription.end_at,
    'totalMonths', v_subscription.total_months,
    'status', v_subscription.status
  );
end;
$function$;

revoke execute on function public.subscribe_creator(uuid, uuid, text) from public;
revoke execute on function public.subscribe_creator(uuid, uuid, text) from anon;
revoke execute on function public.subscribe_creator(uuid, uuid, text) from authenticated;
grant execute on function public.subscribe_creator(uuid, uuid, text) to service_role;

create or replace function public.get_user_donation_snapshot_v2(
  p_actor_user_id uuid,
  p_year integer default null,
  p_month integer default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_result jsonb;
  v_now_kst timestamp without time zone := now() at time zone 'Asia/Seoul';
  v_current_year integer := extract(year from v_now_kst)::integer;
  v_current_month integer := extract(month from v_now_kst)::integer;
  v_history_year integer := coalesce(p_year, v_current_year);
  v_history_month integer := coalesce(p_month, v_current_month);
  v_history_start timestamp with time zone;
  v_history_end timestamp with time zone;
  v_current_month_start timestamp with time zone := make_date(
    v_current_year,
    v_current_month,
    1
  )::timestamp at time zone 'Asia/Seoul';
  v_next_current_month_start timestamp with time zone := (
    make_date(v_current_year, v_current_month, 1) + interval '1 month'
  )::timestamp at time zone 'Asia/Seoul';
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  if v_history_year < 2020 or v_history_year > 9999 then
    raise sqlstate 'PX400' using message = 'invalid history year';
  end if;

  if v_history_month < 1 or v_history_month > 12 then
    raise sqlstate 'PX400' using message = 'invalid history month';
  end if;

  v_history_start := make_date(
    v_history_year,
    v_history_month,
    1
  )::timestamp at time zone 'Asia/Seoul';
  v_history_end := (
    make_date(v_history_year, v_history_month, 1) + interval '1 month'
  )::timestamp at time zone 'Asia/Seoul';

  select jsonb_build_object(
    'wallet', jsonb_build_object(
      'balanceAmount', coalesce(wallet.balance_amount, 0)
    ),
    'stats', jsonb_build_object(
      'currentMonthDonationAmount', coalesce(donation_stat.current_month_amount, 0),
      'currentMonthChargeAmount', coalesce(charge_stat.current_month_amount, 0),
      'totalDonationAmount', coalesce(donation_stat.total_amount, 0),
      'totalChargeAmount', coalesce(charge_stat.total_amount, 0)
    ),
    'historyPeriod', jsonb_build_object(
      'year', v_history_year,
      'month', v_history_month
    ),
    'sentDonations', coalesce(sent_donation.items, '[]'::jsonb),
    'chargeHistories', coalesce(charge_history.items, '[]'::jsonb),
    'subscriptionSpendHistories', coalesce(subscription_spend_history.items, '[]'::jsonb)
  )
  into v_result
  from public."user" as target_user
  left join public.wallet_account as wallet
    on wallet.user_id = target_user.id
  left join lateral (
    select
      coalesce(sum(donation.amount), 0::bigint) as total_amount,
      coalesce(
        sum(donation.amount) filter (
          where donation.created_at >= v_current_month_start
            and donation.created_at < v_next_current_month_start
        ),
        0
      ) as current_month_amount
    from public.donation as donation
    where donation.donor_id = target_user.id
  ) as donation_stat on true
  left join lateral (
    select
      coalesce(sum(wallet_charge.amount_delta), 0::bigint) as total_amount,
      coalesce(
        sum(wallet_charge.amount_delta) filter (
          where wallet_charge.created_at >= v_current_month_start
            and wallet_charge.created_at < v_next_current_month_start
        ),
        0
      ) as current_month_amount
    from public.wallet_transaction as wallet_charge
    where wallet_charge.user_id = target_user.id
      and wallet_charge.transaction_type = 'charge'::public.wallet_transaction_type
      and wallet_charge.transaction_status = 'succeeded'::public.wallet_transaction_status
  ) as charge_stat on true
  left join lateral (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', ranked.id,
          'broadcastId', ranked.broadcast_id,
          'creatorId', ranked.creator_id,
          'creatorNickname', ranked.creator_nickname,
          'amount', ranked.amount,
          'message', ranked.message,
          'createdAt', ranked.created_at
        )
        order by ranked.created_at desc
      ),
      '[]'::jsonb
    ) as items
    from (
      select
        donation.id,
        donation.broadcast_id,
        donation.creator_id,
        creator.nickname as creator_nickname,
        donation.amount,
        donation.message,
        donation.created_at
      from public.donation as donation
      join public."user" as creator
        on creator.id = donation.creator_id
      where donation.donor_id = target_user.id
        and donation.created_at >= v_history_start
        and donation.created_at < v_history_end
      order by donation.created_at desc
    ) as ranked
  ) as sent_donation on true
  left join lateral (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', ranked.id,
          'status', ranked.transaction_status,
          'amount', ranked.amount_delta,
          'balanceAfter', ranked.balance_after,
          'createdAt', ranked.created_at
        )
        order by ranked.created_at desc
      ),
      '[]'::jsonb
    ) as items
    from (
      select
        wallet_charge.id,
        wallet_charge.transaction_status,
        wallet_charge.amount_delta,
        wallet_charge.balance_after,
        wallet_charge.created_at
      from public.wallet_transaction as wallet_charge
      where wallet_charge.user_id = target_user.id
        and wallet_charge.transaction_type = 'charge'::public.wallet_transaction_type
        and wallet_charge.created_at >= v_history_start
        and wallet_charge.created_at < v_history_end
      order by wallet_charge.created_at desc
    ) as ranked
  ) as charge_history on true
  left join lateral (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', ranked.id,
          'status', ranked.transaction_status,
          'amount', abs(ranked.amount_delta),
          'balanceAfter', ranked.balance_after,
          'creatorId', ranked.creator_id,
          'creatorNickname', ranked.creator_nickname,
          'createdAt', ranked.created_at
        )
        order by ranked.created_at desc
      ),
      '[]'::jsonb
    ) as items
    from (
      select
        wallet_subscription.id,
        wallet_subscription.transaction_status,
        wallet_subscription.amount_delta,
        wallet_subscription.balance_after,
        wallet_subscription.metadata_creator_id as creator_id,
        coalesce(creator.nickname, '알 수 없음') as creator_nickname,
        wallet_subscription.created_at
      from (
        select
          wallet_subscription.id,
          wallet_subscription.transaction_status,
          wallet_subscription.amount_delta,
          wallet_subscription.balance_after,
          case
            when (wallet_subscription.metadata ->> 'creatorId') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
              then (wallet_subscription.metadata ->> 'creatorId')::uuid
            else null
          end as metadata_creator_id,
          wallet_subscription.created_at
        from public.wallet_transaction as wallet_subscription
        where wallet_subscription.user_id = target_user.id
          and wallet_subscription.transaction_type = 'subscription_spend'::public.wallet_transaction_type
          and wallet_subscription.created_at >= v_history_start
          and wallet_subscription.created_at < v_history_end
      ) as wallet_subscription
      left join public."user" as creator
        on creator.id = wallet_subscription.metadata_creator_id
      order by wallet_subscription.created_at desc
    ) as ranked
  ) as subscription_spend_history on true
  where target_user.id = p_actor_user_id
  limit 1;

  if v_result is null then
    raise sqlstate 'PX404' using message = 'user not found';
  end if;

  return v_result;
end;
$function$;

revoke execute on function public.get_user_donation_snapshot_v2(uuid, integer, integer) from public;
revoke execute on function public.get_user_donation_snapshot_v2(uuid, integer, integer) from anon;
revoke execute on function public.get_user_donation_snapshot_v2(uuid, integer, integer) from authenticated;
grant execute on function public.get_user_donation_snapshot_v2(uuid, integer, integer) to service_role;
