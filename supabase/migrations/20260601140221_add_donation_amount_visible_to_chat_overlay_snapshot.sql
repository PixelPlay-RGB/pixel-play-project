-- 채팅 오버레이 스냅샷에 금액 표시 설정을 포함해, 실시간 후원 메시지도 동일하게 금액 표시 여부를 따르도록 합니다.
CREATE OR REPLACE FUNCTION public.get_live_chat_overlay_snapshot(p_creator_id uuid, p_limit integer DEFAULT 60)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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

  select *
  into v_broadcast
  from public.live_broadcast as broadcast
  where broadcast.creator_id = p_creator_id
    and broadcast.ended_at is null
  order by broadcast.started_at desc
  limit 1;

  if not found then
    return jsonb_build_object(
      'broadcast', null,
      'donationMessageEnabled', v_donation_message_enabled,
      'donationAmountVisible', v_amount_visible,
      'items', '[]'::jsonb
    );
  end if;

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
              'role', case when message.sender_id = v_broadcast.creator_id then 'creator' else null end,
              'tone', case when message.sender_id = v_broadcast.creator_id then 'brand' else null end
            )
          )
        )
      end as item
    from public.live_message as message
    where message.broadcast_id = v_broadcast.id
      and (
        message.message_type = 'chat'::public.live_message_type
        or (v_donation_message_enabled and message.message_type = 'donation'::public.live_message_type)
      )
    order by message.created_at desc
    limit v_limit
  ) as source;

  return jsonb_build_object(
    'broadcast', jsonb_build_object(
      'id', v_broadcast.id,
      'title', v_broadcast.title,
      'creatorId', v_broadcast.creator_id,
      'currentViewerCount', v_broadcast.current_viewer_count,
      'startedAt', v_broadcast.started_at
    ),
    'donationMessageEnabled', v_donation_message_enabled,
    'donationAmountVisible', v_amount_visible,
    'items', coalesce(v_items, '[]'::jsonb)
  );
end;
$function$;