-- 금액 표시(amountVisible)가 꺼져 있으면 오버레이 payload에서도 금액을 숨깁니다.
-- 소비자가 플래그를 놓쳐도 금액이 새지 않도록 데이터 경계에서 amount를 null로 만듭니다.

CREATE OR REPLACE FUNCTION public.get_live_donation_alert_overlay_snapshot(p_creator_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_creator_name text := '크리에이터';
  v_alert_duration_seconds integer := 5;
  v_settings jsonb := '{}'::jsonb;
  v_amount_visible boolean := true;
  v_broadcast public.live_broadcast%rowtype;
  v_donation jsonb;
begin
  if p_creator_id is null then
    return null;
  end if;

  select
    coalesce(nullif(target_user.nickname, ''), '크리에이터'),
    coalesce(setting.donation_alert_duration_seconds, 5),
    coalesce(setting.donation_amount_visible, true),
    jsonb_build_object(
      'alertSoundEnabled', coalesce(setting.alert_sound_enabled, true),
      'alertSoundKey', coalesce(setting.alert_sound_key, 'classic'),
      'alertVolume', coalesce(setting.alert_volume, 32),
      'ttsEnabled', coalesce(setting.tts_enabled, true),
      'ttsRate', coalesce(setting.tts_rate, 1.0),
      'ttsVolume', coalesce(setting.tts_volume, 80),
      'ttsVoiceUri', coalesce(setting.tts_voice_uri, ''),
      'amountVisible', coalesce(setting.donation_amount_visible, true)
    )
  into v_creator_name, v_alert_duration_seconds, v_amount_visible, v_settings
  from public."user" as target_user
  left join public.creator_studio_setting as setting on setting.creator_id = target_user.id
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
      'alertVisibleMs', v_alert_duration_seconds * 1000,
      'donation', null
    ) || v_settings;
  end if;

  select jsonb_build_object(
    'id', coalesce(message.donation_id, message.id),
    'creatorName', v_creator_name,
    'donorName', coalesce(nullif(message.metadata->>'donorNickname', ''), '시청자'),
    'amount', case when v_amount_visible then (message.metadata->>'amount')::integer else null end,
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
    'alertVisibleMs', v_alert_duration_seconds * 1000,
    'donation', v_donation
  ) || v_settings;
end;
$function$;
