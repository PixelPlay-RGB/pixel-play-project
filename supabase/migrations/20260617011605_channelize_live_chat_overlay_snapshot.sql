-- OBS 채팅 오버레이 초기 스냅샷을 '활성 방송' 단위에서 '채널(creator)' 단위로 바꾼다.
-- 채팅은 채널 단위(#111 방송 외 채팅 개방 정책)라, 방송을 안 켜도 시청 채팅과 동일 기준
-- (creator_id + is_chat_visible)으로 최근 메시지를 불러온다. realtime 구독은 이미 채널 단위라 일치한다.
-- 역할 뱃지는 시청 채팅과 동일하게 동시 보유분을 모두(creator/manager/donor/subscriber) roles 배열로 합성한다.
create or replace function public.get_live_chat_overlay_snapshot(p_creator_id uuid, p_limit integer default 60)
 returns jsonb
 language plpgsql
 stable security definer
 set search_path to ''
as $function$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 60), 1), 100);
  v_broadcast public.live_broadcast%rowtype;
  v_donation_message_enabled boolean := false;
  v_amount_visible boolean := true;
  v_items jsonb;
begin
  if p_creator_id is null then
    return null;
  end if;

  select
    coalesce(setting.chat_donation_message_enabled, false),
    coalesce(setting.donation_amount_visible, true)
  into v_donation_message_enabled, v_amount_visible
  from public.creator_studio_setting as setting
  where setting.creator_id = p_creator_id;

  -- 활성 방송은 제목·시청자수 정보용으로만 조회한다(없어도 채팅은 아래에서 채널 단위로 불러온다).
  select *
  into v_broadcast
  from public.live_broadcast as broadcast
  where broadcast.creator_id = p_creator_id
    and broadcast.ended_at is null
  order by broadcast.started_at desc
  limit 1;

  -- 채팅: 채널(creator) 단위로 방송 외에도 최근 메시지를 불러온다(시청 채팅과 동일 기준).
  select coalesce(jsonb_agg(source.item order by source.created_at asc), '[]'::jsonb)
  into v_items
  from (
    select
      message.created_at,
      case
        when message.message_type = 'donation'::public.live_message_type then jsonb_build_object(
          'type', 'message',
          'message', jsonb_strip_nulls(
            jsonb_build_object(
              'id', message.id,
              'kind', 'donation',
              'author', coalesce(nullif(message.metadata->>'donorNickname', ''), '시청자'),
              'content', message.content,
              'amount', case
                when v_amount_visible and jsonb_typeof(message.metadata->'amount') = 'number'
                  then (message.metadata->>'amount')::integer
                else null
              end,
              'createdAt', message.created_at
            )
          )
        )
        else jsonb_build_object(
          'type', 'message',
          'message', jsonb_strip_nulls(
            jsonb_build_object(
              'id', message.id,
              'kind', 'chat',
              'author', coalesce(nullif(message.metadata->>'senderNickname', ''), '시청자'),
              'content', message.content,
              'createdAt', message.created_at,
              'roles', (
                (case
                  when message.sender_id = p_creator_id or message.sender_role::text = 'creator'
                    then jsonb_build_array('creator')
                  when message.sender_role::text = 'manager'
                    then jsonb_build_array('manager')
                  else '[]'::jsonb
                end)
                || (case when coalesce(message.metadata->>'isDonor', 'false') = 'true' then jsonb_build_array('donor') else '[]'::jsonb end)
                || (case when coalesce(message.metadata->>'isSubscriber', 'false') = 'true' then jsonb_build_array('subscriber') else '[]'::jsonb end)
              ),
              'tone', case when message.sender_id = p_creator_id or message.sender_role::text = 'creator' then 'brand' else null end
            )
          )
        )
      end as item
    from public.live_message as message
    where message.creator_id = p_creator_id
      and message.is_chat_visible = true
      and (
        message.message_type = 'chat'::public.live_message_type
        or (v_donation_message_enabled and message.message_type = 'donation'::public.live_message_type)
      )
    order by message.created_at desc
    limit v_limit
  ) as source;

  return jsonb_build_object(
    'broadcast', case
      when v_broadcast.id is null then null
      else jsonb_build_object(
        'id', v_broadcast.id,
        'title', v_broadcast.title,
        'creatorId', v_broadcast.creator_id,
        'currentViewerCount', v_broadcast.current_viewer_count,
        'startedAt', v_broadcast.started_at
      )
    end,
    'donationMessageEnabled', v_donation_message_enabled,
    'donationAmountVisible', v_amount_visible,
    'items', coalesce(v_items, '[]'::jsonb)
  );
end;
$function$;
