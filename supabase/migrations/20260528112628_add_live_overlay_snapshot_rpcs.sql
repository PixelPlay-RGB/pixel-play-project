-- Live OBS overlay snapshot RPCs.

create or replace function public.get_live_chat_overlay_snapshot(
  p_creator_id uuid,
  p_limit integer default 60
)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 60), 1), 100);
  v_broadcast public.live_broadcast%rowtype;
  v_items jsonb;
begin
  if p_creator_id is null then
    return null;
  end if;

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
      'items', '[]'::jsonb
    );
  end if;

  select coalesce(jsonb_agg(source.item order by source.created_at asc), '[]'::jsonb)
  into v_items
  from (
    select
      message.created_at,
      jsonb_build_object(
        'type', 'message',
        'message', jsonb_strip_nulls(
          jsonb_build_object(
            'id', message.id,
            'author', coalesce(nullif(message.metadata->>'senderNickname', ''), '시청자'),
            'content', message.content,
            'createdAt', message.created_at,
            'role', case when message.sender_id = v_broadcast.creator_id then 'creator' else null end,
            'tone', case when message.sender_id = v_broadcast.creator_id then 'brand' else null end
          )
        )
      ) as item
    from public.live_message as message
    where message.broadcast_id = v_broadcast.id
      and message.message_type = 'chat'::public.live_message_type
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
    'items', coalesce(v_items, '[]'::jsonb)
  );
end;
$function$;

create or replace function public.get_live_donation_alert_overlay_snapshot(p_creator_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_creator_name text := '크리에이터';
  v_broadcast public.live_broadcast%rowtype;
  v_donation jsonb;
begin
  if p_creator_id is null then
    return null;
  end if;

  select coalesce(nullif(target_user.nickname, ''), '크리에이터')
  into v_creator_name
  from public."user" as target_user
  where target_user.id = p_creator_id;

  select *
  into v_broadcast
  from public.live_broadcast as broadcast
  where broadcast.creator_id = p_creator_id
    and broadcast.ended_at is null
  order by broadcast.started_at desc
  limit 1;

  if not found then
    return jsonb_build_object(
      'broadcastId', null,
      'creatorName', v_creator_name,
      'donation', null
    );
  end if;

  select jsonb_build_object(
    'id', coalesce(message.donation_id, message.id),
    'creatorName', v_creator_name,
    'donorName', coalesce(nullif(message.metadata->>'donorNickname', ''), '시청자'),
    'amount', (message.metadata->>'amount')::integer,
    'message', message.content,
    'createdAt', message.created_at
  )
  into v_donation
  from public.live_message as message
  where message.broadcast_id = v_broadcast.id
    and message.message_type = 'donation'::public.live_message_type
    and jsonb_typeof(message.metadata->'amount') = 'number'
  order by message.created_at desc
  limit 1;

  return jsonb_build_object(
    'broadcastId', v_broadcast.id,
    'creatorName', v_creator_name,
    'donation', v_donation
  );
end;
$function$;

revoke execute on function public.get_live_chat_overlay_snapshot(uuid, integer) from public;
revoke execute on function public.get_live_chat_overlay_snapshot(uuid, integer) from anon;
revoke execute on function public.get_live_chat_overlay_snapshot(uuid, integer) from authenticated;
grant execute on function public.get_live_chat_overlay_snapshot(uuid, integer) to service_role;

revoke execute on function public.get_live_donation_alert_overlay_snapshot(uuid) from public;
revoke execute on function public.get_live_donation_alert_overlay_snapshot(uuid) from anon;
revoke execute on function public.get_live_donation_alert_overlay_snapshot(uuid) from authenticated;
grant execute on function public.get_live_donation_alert_overlay_snapshot(uuid) to service_role;
