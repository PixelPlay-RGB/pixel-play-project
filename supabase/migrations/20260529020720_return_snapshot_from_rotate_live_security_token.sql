drop function if exists public.rotate_live_security_token_version(uuid, text);

create or replace function public.rotate_live_security_token_version(
  p_actor_user_id uuid,
  p_token_kind text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_token_kind text := btrim(coalesce(p_token_kind, ''));
  v_new_version integer;
  v_snapshot jsonb;
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

  v_snapshot := public.get_creator_studio_snapshot(p_actor_user_id);

  return jsonb_build_object(
    'tokenKind', v_token_kind,
    'version', v_new_version,
    'snapshot', v_snapshot
  );
end;
$function$;

revoke execute on function public.rotate_live_security_token_version(uuid, text) from public;
revoke execute on function public.rotate_live_security_token_version(uuid, text) from anon;
revoke execute on function public.rotate_live_security_token_version(uuid, text) from authenticated;
grant execute on function public.rotate_live_security_token_version(uuid, text) to service_role;
