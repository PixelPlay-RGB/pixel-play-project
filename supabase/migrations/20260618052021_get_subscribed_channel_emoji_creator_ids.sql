-- 로그인 사용자가 사용할 수 있는 채널 이모지 creator id를 DB 서버 시간 기준으로 반환한다.

create or replace function public.get_available_channel_emoji_creator_ids()
returns table (creator_id uuid)
language sql
stable
security invoker
set search_path to ''
as $function$
  select auth.uid() as creator_id
  where auth.uid() is not null

  union

  select distinct subscription.creator_id
  from public.creator_subscription as subscription
  where subscription.subscriber_id = (select auth.uid())
    and subscription.status in (
      'active'::public.creator_subscription_status,
      'canceled'::public.creator_subscription_status
    )
    and subscription.end_at > now();
$function$;

revoke execute on function public.get_available_channel_emoji_creator_ids() from public;
revoke execute on function public.get_available_channel_emoji_creator_ids() from anon;
grant execute on function public.get_available_channel_emoji_creator_ids() to authenticated;
grant execute on function public.get_available_channel_emoji_creator_ids() to service_role;
