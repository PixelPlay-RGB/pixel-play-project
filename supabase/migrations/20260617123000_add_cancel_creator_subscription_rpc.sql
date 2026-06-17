-- 크리에이터 구독 해지 상태 전환을 서비스 RPC로 캡슐화한다.

create or replace function public.cancel_creator_subscription(
  p_actor_user_id uuid,
  p_subscription_id uuid default null,
  p_creator_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_subscription public.creator_subscription%rowtype;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  if p_subscription_id is null and p_creator_id is null then
    raise sqlstate 'PX400' using message = 'invalid subscription target';
  end if;

  update public.creator_subscription as subscription
  set status = 'canceled'::public.creator_subscription_status
  where subscription.subscriber_id = p_actor_user_id
    and subscription.status = 'active'::public.creator_subscription_status
    and (
      (p_subscription_id is not null and subscription.id = p_subscription_id)
      or (
        p_subscription_id is null
        and p_creator_id is not null
        and subscription.creator_id = p_creator_id
      )
    )
  returning * into v_subscription;

  if not found then
    raise sqlstate 'PX404' using message = 'subscription not found';
  end if;

  return jsonb_build_object(
    'id', v_subscription.id,
    'creatorId', v_subscription.creator_id,
    'subscriberId', v_subscription.subscriber_id,
    'status', v_subscription.status,
    'endAt', v_subscription.end_at
  );
end;
$function$;

revoke execute on function public.cancel_creator_subscription(uuid, uuid, uuid) from public;
revoke execute on function public.cancel_creator_subscription(uuid, uuid, uuid) from anon;
revoke execute on function public.cancel_creator_subscription(uuid, uuid, uuid) from authenticated;
grant execute on function public.cancel_creator_subscription(uuid, uuid, uuid) to service_role;
