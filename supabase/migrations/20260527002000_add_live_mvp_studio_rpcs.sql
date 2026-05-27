-- Live MVP creator studio write RPCs.
-- These functions are service_role-only and are intended to be called from Server Actions.

create unique index if not exists live_broadcast_one_active_per_creator_idx
  on public.live_broadcast using btree (creator_id)
  where ended_at is null;

create or replace function public.upsert_creator_studio_setting(
  p_actor_user_id uuid,
  p_default_title text default null,
  p_default_tags text[] default null,
  p_chat_scope public.live_chat_scope default null,
  p_follower_wait_seconds integer default null,
  p_slow_mode_enabled boolean default null,
  p_slow_mode_seconds integer default null,
  p_link_blocked boolean default null,
  p_forbidden_words text[] default null,
  p_chat_rule_text text default null,
  p_donation_enabled boolean default null,
  p_donation_min_amount integer default null,
  p_donation_amount_visible boolean default null,
  p_donation_alert_enabled boolean default null,
  p_alert_sound_enabled boolean default null,
  p_alert_volume integer default null,
  p_tts_enabled boolean default null,
  p_tts_rate numeric default null,
  p_settlement_demo jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  perform 1
  from public."user" as target_user
  where target_user.id = p_actor_user_id;

  if not found then
    raise sqlstate 'PX404' using message = 'user not found';
  end if;

  insert into public.creator_studio_setting as setting (
    creator_id,
    default_title,
    default_tags,
    chat_scope,
    follower_wait_seconds,
    slow_mode_enabled,
    slow_mode_seconds,
    link_blocked,
    forbidden_words,
    chat_rule_text,
    donation_enabled,
    donation_min_amount,
    donation_amount_visible,
    donation_alert_enabled,
    alert_sound_enabled,
    alert_volume,
    tts_enabled,
    tts_rate,
    settlement_demo
  )
  values (
    p_actor_user_id,
    coalesce(btrim(p_default_title), ''),
    coalesce(p_default_tags, '{}'::text[]),
    coalesce(p_chat_scope, 'authenticated'::public.live_chat_scope),
    coalesce(p_follower_wait_seconds, 0),
    coalesce(p_slow_mode_enabled, false),
    coalesce(p_slow_mode_seconds, 3),
    coalesce(p_link_blocked, true),
    coalesce(p_forbidden_words, '{}'::text[]),
    coalesce(p_chat_rule_text, ''),
    coalesce(p_donation_enabled, true),
    coalesce(p_donation_min_amount, 1000),
    coalesce(p_donation_amount_visible, true),
    coalesce(p_donation_alert_enabled, true),
    coalesce(p_alert_sound_enabled, true),
    coalesce(p_alert_volume, 32),
    coalesce(p_tts_enabled, true),
    coalesce(p_tts_rate, 1.00),
    coalesce(
      p_settlement_demo,
      '{"status":"ready","totalAmount":99999,"bankName":"Demo Bank","accountHolder":"PixelPlay Creator"}'::jsonb
    )
  )
  on conflict (creator_id) do update
  set
    default_title = case
      when p_default_title is null then setting.default_title
      else btrim(p_default_title)
    end,
    default_tags = coalesce(p_default_tags, setting.default_tags),
    chat_scope = coalesce(p_chat_scope, setting.chat_scope),
    follower_wait_seconds = coalesce(p_follower_wait_seconds, setting.follower_wait_seconds),
    slow_mode_enabled = coalesce(p_slow_mode_enabled, setting.slow_mode_enabled),
    slow_mode_seconds = coalesce(p_slow_mode_seconds, setting.slow_mode_seconds),
    link_blocked = coalesce(p_link_blocked, setting.link_blocked),
    forbidden_words = coalesce(p_forbidden_words, setting.forbidden_words),
    chat_rule_text = case
      when p_chat_rule_text is null then setting.chat_rule_text
      else p_chat_rule_text
    end,
    chat_rule_version = case
      when p_chat_rule_text is not null
        and p_chat_rule_text is distinct from setting.chat_rule_text
        then setting.chat_rule_version + 1
      else setting.chat_rule_version
    end,
    donation_enabled = coalesce(p_donation_enabled, setting.donation_enabled),
    donation_min_amount = coalesce(p_donation_min_amount, setting.donation_min_amount),
    donation_amount_visible = coalesce(p_donation_amount_visible, setting.donation_amount_visible),
    donation_alert_enabled = coalesce(p_donation_alert_enabled, setting.donation_alert_enabled),
    alert_sound_enabled = coalesce(p_alert_sound_enabled, setting.alert_sound_enabled),
    alert_volume = coalesce(p_alert_volume, setting.alert_volume),
    tts_enabled = coalesce(p_tts_enabled, setting.tts_enabled),
    tts_rate = coalesce(p_tts_rate, setting.tts_rate),
    settlement_demo = coalesce(p_settlement_demo, setting.settlement_demo);

  return public.get_creator_studio_snapshot(p_actor_user_id);
end;
$function$;

create or replace function public.rotate_live_security_token_version(
  p_actor_user_id uuid,
  p_token_kind text
)
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_token_kind text := btrim(coalesce(p_token_kind, ''));
  v_new_version integer;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  insert into public.creator_studio_setting (creator_id)
  values (p_actor_user_id)
  on conflict (creator_id) do nothing;

  if v_token_kind = 'stream_key' then
    update public.creator_studio_setting
    set stream_key_version = stream_key_version + 1
    where creator_id = p_actor_user_id
    returning stream_key_version into v_new_version;
  elsif v_token_kind = 'chat_overlay' then
    update public.creator_studio_setting
    set chat_overlay_version = chat_overlay_version + 1
    where creator_id = p_actor_user_id
    returning chat_overlay_version into v_new_version;
  elsif v_token_kind = 'donation_alert' then
    update public.creator_studio_setting
    set donation_alert_version = donation_alert_version + 1
    where creator_id = p_actor_user_id
    returning donation_alert_version into v_new_version;
  else
    raise sqlstate 'PX400' using message = 'invalid token kind';
  end if;

  if v_new_version is null then
    raise sqlstate 'PX404' using message = 'creator setting not found';
  end if;

  return v_new_version;
end;
$function$;

create or replace function public.start_live_broadcast(
  p_actor_user_id uuid,
  p_title text default null,
  p_tags text[] default null,
  p_thumbnail_url text default null
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_setting public.creator_studio_setting%rowtype;
  v_title text;
  v_tags text[];
  v_broadcast_id uuid;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_actor_user_id::text, 0));

  perform 1
  from public."user" as creator
  where creator.id = p_actor_user_id;

  if not found then
    raise sqlstate 'PX404' using message = 'creator not found';
  end if;

  select *
  into v_setting
  from public.creator_studio_setting as setting
  where setting.creator_id = p_actor_user_id;

  if exists (
    select 1
    from public.live_broadcast as broadcast
    where broadcast.creator_id = p_actor_user_id
      and broadcast.ended_at is null
  ) then
    raise sqlstate 'PX409' using message = 'live broadcast already active';
  end if;

  v_title := btrim(coalesce(p_title, v_setting.default_title, 'PixelPlay 라이브 방송'));
  v_tags := coalesce(p_tags, v_setting.default_tags, '{}'::text[]);

  insert into public.live_broadcast (
    creator_id,
    title,
    tags,
    thumbnail_url
  )
  values (
    p_actor_user_id,
    v_title,
    v_tags,
    nullif(btrim(coalesce(p_thumbnail_url, '')), '')
  )
  returning id into v_broadcast_id;

  return v_broadcast_id;
end;
$function$;

create or replace function public.end_live_broadcast(
  p_actor_user_id uuid,
  p_broadcast_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_broadcast_id uuid;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_actor_user_id::text, 0));

  update public.live_broadcast as broadcast
  set ended_at = now()
  where broadcast.creator_id = p_actor_user_id
    and broadcast.ended_at is null
    and (
      p_broadcast_id is null
      or broadcast.id = p_broadcast_id
    )
  returning broadcast.id into v_broadcast_id;

  if v_broadcast_id is null then
    raise sqlstate 'PX404' using message = 'active live broadcast not found';
  end if;

  return v_broadcast_id;
end;
$function$;

revoke execute on function public.upsert_creator_studio_setting(
  uuid,
  text,
  text[],
  public.live_chat_scope,
  integer,
  boolean,
  integer,
  boolean,
  text[],
  text,
  boolean,
  integer,
  boolean,
  boolean,
  boolean,
  integer,
  boolean,
  numeric,
  jsonb
) from public;
revoke execute on function public.upsert_creator_studio_setting(
  uuid,
  text,
  text[],
  public.live_chat_scope,
  integer,
  boolean,
  integer,
  boolean,
  text[],
  text,
  boolean,
  integer,
  boolean,
  boolean,
  boolean,
  integer,
  boolean,
  numeric,
  jsonb
) from anon;
revoke execute on function public.upsert_creator_studio_setting(
  uuid,
  text,
  text[],
  public.live_chat_scope,
  integer,
  boolean,
  integer,
  boolean,
  text[],
  text,
  boolean,
  integer,
  boolean,
  boolean,
  boolean,
  integer,
  boolean,
  numeric,
  jsonb
) from authenticated;
grant execute on function public.upsert_creator_studio_setting(
  uuid,
  text,
  text[],
  public.live_chat_scope,
  integer,
  boolean,
  integer,
  boolean,
  text[],
  text,
  boolean,
  integer,
  boolean,
  boolean,
  boolean,
  integer,
  boolean,
  numeric,
  jsonb
) to service_role;

revoke execute on function public.rotate_live_security_token_version(uuid, text) from public;
revoke execute on function public.rotate_live_security_token_version(uuid, text) from anon;
revoke execute on function public.rotate_live_security_token_version(uuid, text) from authenticated;
grant execute on function public.rotate_live_security_token_version(uuid, text) to service_role;

revoke execute on function public.start_live_broadcast(uuid, text, text[], text) from public;
revoke execute on function public.start_live_broadcast(uuid, text, text[], text) from anon;
revoke execute on function public.start_live_broadcast(uuid, text, text[], text) from authenticated;
grant execute on function public.start_live_broadcast(uuid, text, text[], text) to service_role;

revoke execute on function public.end_live_broadcast(uuid, uuid) from public;
revoke execute on function public.end_live_broadcast(uuid, uuid) from anon;
revoke execute on function public.end_live_broadcast(uuid, uuid) from authenticated;
grant execute on function public.end_live_broadcast(uuid, uuid) to service_role;
