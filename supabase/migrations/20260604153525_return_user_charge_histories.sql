-- 사용자 후원 지갑 snapshot에서 충전 내역을 별도 반환합니다.
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

revoke execute on function public.get_user_donation_snapshot(uuid) from public;
revoke execute on function public.get_user_donation_snapshot(uuid) from anon;
revoke execute on function public.get_user_donation_snapshot(uuid) from authenticated;
grant execute on function public.get_user_donation_snapshot(uuid) to service_role;
