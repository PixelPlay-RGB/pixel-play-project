-- Restore the original user donation snapshot RPC and add a period-filtered v2.
create or replace function public.get_user_donation_snapshot(p_actor_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_result jsonb;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  select jsonb_build_object(
    'wallet', jsonb_build_object(
      'balanceAmount', coalesce(wallet.balance_amount, 0)
    ),
    'sentDonations', coalesce(sent_donation.items, '[]'::jsonb),
    'chargeHistories', coalesce(charge_history.items, '[]'::jsonb)
  )
  into v_result
  from public."user" as target_user
  left join public.wallet_account as wallet
    on wallet.user_id = target_user.id
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
      order by donation.created_at desc
      limit 20
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
        and wallet_charge.transaction_status = 'succeeded'::public.wallet_transaction_status
      order by wallet_charge.created_at desc
      limit 20
    ) as ranked
  ) as charge_history on true
  where target_user.id = p_actor_user_id
  limit 1;

  if v_result is null then
    raise sqlstate 'PX404' using message = 'user not found';
  end if;

  return v_result;
end;
$function$;

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
    'chargeHistories', coalesce(charge_history.items, '[]'::jsonb)
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
  where target_user.id = p_actor_user_id
  limit 1;

  if v_result is null then
    raise sqlstate 'PX404' using message = 'user not found';
  end if;

  return v_result;
end;
$function$;

revoke execute on function public.get_user_donation_snapshot(uuid) from public;
revoke execute on function public.get_user_donation_snapshot(uuid) from anon;
revoke execute on function public.get_user_donation_snapshot(uuid) from authenticated;
grant execute on function public.get_user_donation_snapshot(uuid) to service_role;

revoke execute on function public.get_user_donation_snapshot_v2(uuid, integer, integer) from public;
revoke execute on function public.get_user_donation_snapshot_v2(uuid, integer, integer) from anon;
revoke execute on function public.get_user_donation_snapshot_v2(uuid, integer, integer) from authenticated;
grant execute on function public.get_user_donation_snapshot_v2(uuid, integer, integer) to service_role;
