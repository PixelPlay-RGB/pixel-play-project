-- Live MVP viewer interaction RPCs.
-- Handles live chat, follow state, chat rule acceptance, and live polls.

create or replace function public.follow_creator(
  p_actor_user_id uuid,
  p_creator_id uuid
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  if p_creator_id is null or p_actor_user_id = p_creator_id then
    raise sqlstate 'PX400' using message = 'invalid creator';
  end if;

  perform 1
  from public."user" as creator
  where creator.id = p_creator_id;

  if not found then
    raise sqlstate 'PX404' using message = 'creator not found';
  end if;

  insert into public.viewer_creator_relation as relation (
    viewer_id,
    creator_id,
    followed_at
  )
  values (
    p_actor_user_id,
    p_creator_id,
    now()
  )
  on conflict (viewer_id, creator_id) do update
  set followed_at = coalesce(relation.followed_at, now());
end;
$function$;

create or replace function public.unfollow_creator(
  p_actor_user_id uuid,
  p_creator_id uuid
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  update public.viewer_creator_relation as relation
  set followed_at = null
  where relation.viewer_id = p_actor_user_id
    and relation.creator_id = p_creator_id;
end;
$function$;

create or replace function public.accept_live_chat_rule(
  p_actor_user_id uuid,
  p_creator_id uuid
)
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_chat_rule_version integer;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  if p_creator_id is null or p_actor_user_id = p_creator_id then
    raise sqlstate 'PX400' using message = 'invalid creator';
  end if;

  select coalesce(setting.chat_rule_version, 1)
  into v_chat_rule_version
  from public."user" as creator
  left join public.creator_studio_setting as setting
    on setting.creator_id = creator.id
  where creator.id = p_creator_id;

  if not found then
    raise sqlstate 'PX404' using message = 'creator not found';
  end if;

  insert into public.viewer_creator_relation (
    viewer_id,
    creator_id,
    chat_rule_accepted_version,
    chat_rule_accepted_at
  )
  values (
    p_actor_user_id,
    p_creator_id,
    v_chat_rule_version,
    now()
  )
  on conflict (viewer_id, creator_id) do update
  set
    chat_rule_accepted_version = v_chat_rule_version,
    chat_rule_accepted_at = now();

  return v_chat_rule_version;
end;
$function$;

create or replace function public.send_live_message(
  p_actor_user_id uuid,
  p_broadcast_id uuid,
  p_content text
)
returns uuid
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

  if v_forbidden_word is not null then
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
      'moderation_notice'::public.live_message_type,
      '클린봇이 부적절한 표현을 감지해 메시지를 숨겼습니다.',
      jsonb_build_object('source', 'cleanbot')
    )
    returning id into v_message_id;

    return v_message_id;
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

  return v_message_id;
end;
$function$;

create or replace function public.create_live_poll(
  p_actor_user_id uuid,
  p_broadcast_id uuid,
  p_title text,
  p_options jsonb,
  p_ends_at timestamp with time zone default null
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_poll_id uuid;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  perform 1
  from public.live_broadcast as broadcast
  where broadcast.id = p_broadcast_id
    and broadcast.creator_id = p_actor_user_id
    and broadcast.ended_at is null;

  if not found then
    raise sqlstate 'PX404' using message = 'active live broadcast not found';
  end if;

  insert into public.live_poll (
    broadcast_id,
    title,
    options,
    ends_at
  )
  values (
    p_broadcast_id,
    btrim(coalesce(p_title, '')),
    p_options,
    p_ends_at
  )
  returning id into v_poll_id;

  return v_poll_id;
end;
$function$;

create or replace function public.vote_live_poll(
  p_actor_user_id uuid,
  p_poll_id uuid,
  p_option_id text
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_poll record;
  v_option_id text := btrim(coalesce(p_option_id, ''));
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  select poll.id, poll.options, poll.ends_at, poll.ended_at
  into v_poll
  from public.live_poll as poll
  join public.live_broadcast as broadcast
    on broadcast.id = poll.broadcast_id
  where poll.id = p_poll_id
    and broadcast.ended_at is null;

  if not found then
    raise sqlstate 'PX404' using message = 'active poll not found';
  end if;

  if v_poll.ended_at is not null
    or (v_poll.ends_at is not null and v_poll.ends_at <= now()) then
    raise sqlstate 'PX409' using message = 'poll already ended';
  end if;

  if not exists (
    select 1
    from jsonb_array_elements(v_poll.options) as option_item
    where option_item ->> 'id' = v_option_id
  ) then
    raise sqlstate 'PX400' using message = 'invalid poll option';
  end if;

  insert into public.live_poll_vote (
    poll_id,
    voter_id,
    option_id
  )
  values (
    p_poll_id,
    p_actor_user_id,
    v_option_id
  );
end;
$function$;

create or replace function public.end_live_poll(
  p_actor_user_id uuid,
  p_poll_id uuid
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_updated_rows integer;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  update public.live_poll as poll
  set ended_at = now()
  from public.live_broadcast as broadcast
  where broadcast.id = poll.broadcast_id
    and poll.id = p_poll_id
    and broadcast.creator_id = p_actor_user_id
    and poll.ended_at is null;

  get diagnostics v_updated_rows = row_count;

  if v_updated_rows = 0 then
    raise sqlstate 'PX404' using message = 'active poll not found';
  end if;
end;
$function$;

revoke execute on function public.follow_creator(uuid, uuid) from public;
revoke execute on function public.follow_creator(uuid, uuid) from anon;
revoke execute on function public.follow_creator(uuid, uuid) from authenticated;
grant execute on function public.follow_creator(uuid, uuid) to service_role;

revoke execute on function public.unfollow_creator(uuid, uuid) from public;
revoke execute on function public.unfollow_creator(uuid, uuid) from anon;
revoke execute on function public.unfollow_creator(uuid, uuid) from authenticated;
grant execute on function public.unfollow_creator(uuid, uuid) to service_role;

revoke execute on function public.accept_live_chat_rule(uuid, uuid) from public;
revoke execute on function public.accept_live_chat_rule(uuid, uuid) from anon;
revoke execute on function public.accept_live_chat_rule(uuid, uuid) from authenticated;
grant execute on function public.accept_live_chat_rule(uuid, uuid) to service_role;

revoke execute on function public.send_live_message(uuid, uuid, text) from public;
revoke execute on function public.send_live_message(uuid, uuid, text) from anon;
revoke execute on function public.send_live_message(uuid, uuid, text) from authenticated;
grant execute on function public.send_live_message(uuid, uuid, text) to service_role;

revoke execute on function public.create_live_poll(uuid, uuid, text, jsonb, timestamp with time zone) from public;
revoke execute on function public.create_live_poll(uuid, uuid, text, jsonb, timestamp with time zone) from anon;
revoke execute on function public.create_live_poll(uuid, uuid, text, jsonb, timestamp with time zone) from authenticated;
grant execute on function public.create_live_poll(uuid, uuid, text, jsonb, timestamp with time zone) to service_role;

revoke execute on function public.vote_live_poll(uuid, uuid, text) from public;
revoke execute on function public.vote_live_poll(uuid, uuid, text) from anon;
revoke execute on function public.vote_live_poll(uuid, uuid, text) from authenticated;
grant execute on function public.vote_live_poll(uuid, uuid, text) to service_role;

revoke execute on function public.end_live_poll(uuid, uuid) from public;
revoke execute on function public.end_live_poll(uuid, uuid) from anon;
revoke execute on function public.end_live_poll(uuid, uuid) from authenticated;
grant execute on function public.end_live_poll(uuid, uuid) to service_role;
