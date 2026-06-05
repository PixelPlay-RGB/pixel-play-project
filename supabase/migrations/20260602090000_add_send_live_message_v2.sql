-- Live chat send RPC v2.
-- Forbidden-word matches are no longer broadcast to every viewer. Instead of inserting a
-- moderation_notice row (which fans out via Realtime to all viewers), the RPC inserts nothing
-- and reports moderation back to the caller so the client can show a sender-only notice.
-- Return shape: jsonb { "messageId": uuid | null, "moderated": boolean }.

create or replace function public.send_live_message_v2(
  p_actor_user_id uuid,
  p_broadcast_id uuid,
  p_content text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_content text := btrim(coalesce(p_content, ''));
  v_broadcast record;
  v_setting public.creator_studio_setting%rowtype;
  v_relation public.viewer_creator_relation%rowtype;
  v_last_message_at timestamp with time zone;
  v_message_id uuid;
  v_forbidden_word text;
  v_sender record;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  if p_broadcast_id is null then
    raise sqlstate 'PX400' using message = 'invalid broadcast';
  end if;

  if char_length(v_content) = 0 or char_length(v_content) > 2000 then
    raise sqlstate 'PX400' using message = 'invalid message content';
  end if;

  select
    target_user.nickname,
    target_user.photo_url
  into v_sender
  from public."user" as target_user
  where target_user.id = p_actor_user_id;

  if not found then
    raise sqlstate 'PX404' using message = 'user not found';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_broadcast_id::text || ':' || p_actor_user_id::text, 0));

  select
    broadcast.id,
    broadcast.creator_id
  into v_broadcast
  from public.live_broadcast as broadcast
  where broadcast.id = p_broadcast_id
    and broadcast.ended_at is null;

  if not found then
    raise sqlstate 'PX404' using message = 'active live broadcast not found';
  end if;

  select *
  into v_setting
  from public.creator_studio_setting as setting
  where setting.creator_id = v_broadcast.creator_id;

  select *
  into v_relation
  from public.viewer_creator_relation as relation
  where relation.viewer_id = p_actor_user_id
    and relation.creator_id = v_broadcast.creator_id;

  if coalesce(v_setting.chat_scope, 'authenticated'::public.live_chat_scope) = 'manager'::public.live_chat_scope
    and p_actor_user_id <> v_broadcast.creator_id then
    raise sqlstate 'PX403' using message = 'manager only chat';
  end if;

  if coalesce(v_setting.chat_scope, 'authenticated'::public.live_chat_scope) = 'follower'::public.live_chat_scope
    and p_actor_user_id <> v_broadcast.creator_id then
    if v_relation.followed_at is null then
      raise sqlstate 'PX403' using message = 'follower only chat';
    end if;

    if v_relation.followed_at > now() - make_interval(secs => coalesce(v_setting.follower_wait_seconds, 0)) then
      raise sqlstate 'PX403' using message = 'follower wait time required';
    end if;
  end if;

  if char_length(coalesce(v_setting.chat_rule_text, '')) > 0
    and p_actor_user_id <> v_broadcast.creator_id
    and coalesce(v_relation.chat_rule_accepted_version, 0) < coalesce(v_setting.chat_rule_version, 1) then
    raise sqlstate 'PX428' using message = 'chat rule acceptance required';
  end if;

  if coalesce(v_setting.slow_mode_enabled, false)
    and p_actor_user_id <> v_broadcast.creator_id then
    select message.created_at
    into v_last_message_at
    from public.live_message as message
    where message.broadcast_id = p_broadcast_id
      and message.sender_id = p_actor_user_id
      and message.message_type = 'chat'::public.live_message_type
    order by message.created_at desc
    limit 1;

    if v_last_message_at is not null
      and v_last_message_at > now() - make_interval(secs => coalesce(v_setting.slow_mode_seconds, 3)) then
      raise sqlstate 'PX429' using message = 'slow mode wait required';
    end if;
  end if;

  if coalesce(v_setting.link_blocked, true)
    and v_content ~* '(https?://|www\.)' then
    raise sqlstate 'PX422' using message = 'link is blocked';
  end if;

  select word
  into v_forbidden_word
  from unnest(coalesce(v_setting.forbidden_words, '{}'::text[])) as word
  where btrim(word) <> ''
    and v_content ilike '%' || btrim(word) || '%'
  limit 1;

  -- 금칙어 매칭: 어떤 행도 insert하지 않는다(Realtime fan-out 0). 작성자 본인에게만
  -- 안내가 보이도록 moderated 플래그만 돌려준다.
  if v_forbidden_word is not null then
    return jsonb_build_object(
      'messageId', null,
      'moderated', true
    );
  end if;

  insert into public.live_message (
    broadcast_id,
    sender_id,
    message_type,
    content,
    metadata
  )
  values (
    p_broadcast_id,
    p_actor_user_id,
    'chat'::public.live_message_type,
    v_content,
    jsonb_build_object(
      'senderNickname', v_sender.nickname,
      'senderPhotoUrl', v_sender.photo_url
    )
  )
  returning id into v_message_id;

  return jsonb_build_object(
    'messageId', v_message_id,
    'moderated', false
  );
end;
$function$;

revoke execute on function public.send_live_message_v2(uuid, uuid, text) from public;
revoke execute on function public.send_live_message_v2(uuid, uuid, text) from anon;
revoke execute on function public.send_live_message_v2(uuid, uuid, text) from authenticated;
grant execute on function public.send_live_message_v2(uuid, uuid, text) to service_role;
