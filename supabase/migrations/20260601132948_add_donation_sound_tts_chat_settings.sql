-- 알림음 선택 / TTS 볼륨 분리 / TTS 음성 / 채팅창 후원 메시지 설정 컬럼 추가
ALTER TABLE public.creator_studio_setting
  ADD COLUMN IF NOT EXISTS alert_sound_key text NOT NULL DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS tts_volume integer NOT NULL DEFAULT 80,
  ADD COLUMN IF NOT EXISTS tts_voice_uri text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS chat_donation_message_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE public.creator_studio_setting
  DROP CONSTRAINT IF EXISTS creator_studio_setting_tts_volume_range;
ALTER TABLE public.creator_studio_setting
  ADD CONSTRAINT creator_studio_setting_tts_volume_range CHECK (tts_volume >= 0 AND tts_volume <= 100);

-- 스냅샷 RPC: 신규 설정 필드 노출
CREATE OR REPLACE FUNCTION public.get_creator_studio_snapshot(p_actor_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_result jsonb;
begin
  if p_actor_user_id is null then
    raise sqlstate 'PX401' using message = 'not authenticated';
  end if;

  select jsonb_build_object(
    'settings', jsonb_build_object(
      'defaultTitle', coalesce(setting.default_title, ''),
      'defaultTags', coalesce(setting.default_tags, '{}'::text[]),
      'chatScope', coalesce(setting.chat_scope, 'authenticated'::public.live_chat_scope),
      'followerWaitSeconds', coalesce(setting.follower_wait_seconds, 0),
      'slowModeEnabled', coalesce(setting.slow_mode_enabled, false),
      'slowModeSeconds', coalesce(setting.slow_mode_seconds, 3),
      'linkBlocked', coalesce(setting.link_blocked, true),
      'forbiddenWords', coalesce(setting.forbidden_words, '{}'::text[]),
      'chatRuleText', coalesce(setting.chat_rule_text, ''),
      'chatRuleVersion', coalesce(setting.chat_rule_version, 1),
      'chatDonationMessageEnabled', coalesce(setting.chat_donation_message_enabled, false),
      'donationEnabled', coalesce(setting.donation_enabled, true),
      'donationMinAmount', coalesce(setting.donation_min_amount, 1000),
      'donationAmountVisible', coalesce(setting.donation_amount_visible, true),
      'donationAlertEnabled', coalesce(setting.donation_alert_enabled, true),
      'donationAlertDurationSeconds', coalesce(setting.donation_alert_duration_seconds, 5),
      'alertSoundEnabled', coalesce(setting.alert_sound_enabled, true),
      'alertSoundKey', coalesce(setting.alert_sound_key, 'classic'),
      'alertVolume', coalesce(setting.alert_volume, 32),
      'ttsEnabled', coalesce(setting.tts_enabled, true),
      'ttsRate', coalesce(setting.tts_rate, 1.00),
      'ttsVolume', coalesce(setting.tts_volume, 80),
      'ttsVoiceUri', coalesce(setting.tts_voice_uri, ''),
      'settlementDemo', coalesce(setting.settlement_demo, '{"status":"ready","totalAmount":99999,"bankName":"Demo Bank","accountHolder":"PixelPlay Creator"}'::jsonb),
      'streamKeyVersion', coalesce(setting.stream_key_version, 1),
      'chatOverlayVersion', coalesce(setting.chat_overlay_version, 1),
      'donationAlertVersion', coalesce(setting.donation_alert_version, 1)
    ),
    'activeBroadcast', case
      when broadcast.id is null then 'null'::jsonb
      else jsonb_build_object(
        'id', broadcast.id,
        'title', broadcast.title,
        'tags', broadcast.tags,
        'thumbnailUrl', broadcast.thumbnail_url,
        'startedAt', broadcast.started_at,
        'currentViewerCount', broadcast.current_viewer_count,
        'peakViewerCount', broadcast.peak_viewer_count,
        'chatMessageCount', broadcast.chat_message_count,
        'donationCount', broadcast.donation_count,
        'donationAmountTotal', broadcast.donation_amount_total
      )
    end,
    'monthlyDonation', jsonb_build_object(
      'amountTotal', coalesce(monthly_donation.amount_total, 0),
      'donationCount', coalesce(monthly_donation.donation_count, 0)
    ),
    'recentDonations', coalesce(recent_donation.items, '[]'::jsonb)
  )
  into v_result
  from public."user" as creator
  left join public.creator_studio_setting as setting on setting.creator_id = creator.id
  left join lateral (
    select *
    from public.live_broadcast as active_broadcast
    where active_broadcast.creator_id = creator.id and active_broadcast.ended_at is null
    order by active_broadcast.started_at desc
    limit 1
  ) as broadcast on true
  left join lateral (
    select
      coalesce(sum(donation.amount), 0)::integer as amount_total,
      count(*)::integer as donation_count
    from public.donation as donation
    where donation.creator_id = creator.id and donation.created_at >= date_trunc('month', now())
  ) as monthly_donation on true
  left join lateral (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', ranked.id,
          'broadcastId', ranked.broadcast_id,
          'donorId', ranked.donor_id,
          'donorNickname', case when ranked.is_anonymous then '익명' else ranked.donor_nickname end,
          'amount', ranked.amount,
          'message', ranked.message,
          'createdAt', ranked.created_at
        )
        order by ranked.created_at desc
      ),
      '[]'::jsonb
    ) as items
    from (
      select
        donation.id,
        donation.broadcast_id,
        donation.donor_id,
        donor.nickname as donor_nickname,
        donation.amount,
        donation.message,
        donation.is_anonymous,
        donation.created_at
      from public.donation as donation
      join public."user" as donor on donor.id = donation.donor_id
      where donation.creator_id = creator.id
      order by donation.created_at desc
      limit 10
    ) as ranked
  ) as recent_donation on true
  where creator.id = p_actor_user_id
  limit 1;

  if v_result is null then
    raise sqlstate 'PX404' using message = 'creator not found';
  end if;

  return v_result;
end;
$function$;

-- 쓰기 RPC: 신규 파라미터 4종 추가를 위해 기존 시그니처 제거 후 재생성
DROP FUNCTION IF EXISTS public.upsert_creator_studio_setting(uuid, text, text[], live_chat_scope, integer, boolean, integer, boolean, text[], text, boolean, integer, boolean, boolean, integer, boolean, integer, boolean, numeric, jsonb);

CREATE OR REPLACE FUNCTION public.upsert_creator_studio_setting(
  p_actor_user_id uuid,
  p_default_title text DEFAULT NULL::text,
  p_default_tags text[] DEFAULT NULL::text[],
  p_chat_scope live_chat_scope DEFAULT NULL::live_chat_scope,
  p_follower_wait_seconds integer DEFAULT NULL::integer,
  p_slow_mode_enabled boolean DEFAULT NULL::boolean,
  p_slow_mode_seconds integer DEFAULT NULL::integer,
  p_link_blocked boolean DEFAULT NULL::boolean,
  p_forbidden_words text[] DEFAULT NULL::text[],
  p_chat_rule_text text DEFAULT NULL::text,
  p_donation_enabled boolean DEFAULT NULL::boolean,
  p_donation_min_amount integer DEFAULT NULL::integer,
  p_donation_amount_visible boolean DEFAULT NULL::boolean,
  p_donation_alert_enabled boolean DEFAULT NULL::boolean,
  p_donation_alert_duration_seconds integer DEFAULT NULL::integer,
  p_alert_sound_enabled boolean DEFAULT NULL::boolean,
  p_alert_volume integer DEFAULT NULL::integer,
  p_tts_enabled boolean DEFAULT NULL::boolean,
  p_tts_rate numeric DEFAULT NULL::numeric,
  p_settlement_demo jsonb DEFAULT NULL::jsonb,
  p_chat_donation_message_enabled boolean DEFAULT NULL::boolean,
  p_alert_sound_key text DEFAULT NULL::text,
  p_tts_volume integer DEFAULT NULL::integer,
  p_tts_voice_uri text DEFAULT NULL::text
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
    chat_donation_message_enabled,
    donation_enabled,
    donation_min_amount,
    donation_amount_visible,
    donation_alert_enabled,
    donation_alert_duration_seconds,
    alert_sound_enabled,
    alert_sound_key,
    alert_volume,
    tts_enabled,
    tts_rate,
    tts_volume,
    tts_voice_uri,
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
    coalesce(p_chat_donation_message_enabled, false),
    coalesce(p_donation_enabled, true),
    coalesce(p_donation_min_amount, 1000),
    coalesce(p_donation_amount_visible, true),
    coalesce(p_donation_alert_enabled, true),
    coalesce(p_donation_alert_duration_seconds, 5),
    coalesce(p_alert_sound_enabled, true),
    coalesce(p_alert_sound_key, 'classic'),
    coalesce(p_alert_volume, 32),
    coalesce(p_tts_enabled, true),
    coalesce(p_tts_rate, 1.00),
    coalesce(p_tts_volume, 80),
    coalesce(p_tts_voice_uri, ''),
    coalesce(p_settlement_demo, '{"status":"ready","totalAmount":99999,"bankName":"Demo Bank","accountHolder":"PixelPlay Creator"}'::jsonb)
  )
  on conflict (creator_id) do update
  set
    default_title = case when p_default_title is null then setting.default_title else btrim(p_default_title) end,
    default_tags = coalesce(p_default_tags, setting.default_tags),
    chat_scope = coalesce(p_chat_scope, setting.chat_scope),
    follower_wait_seconds = coalesce(p_follower_wait_seconds, setting.follower_wait_seconds),
    slow_mode_enabled = coalesce(p_slow_mode_enabled, setting.slow_mode_enabled),
    slow_mode_seconds = coalesce(p_slow_mode_seconds, setting.slow_mode_seconds),
    link_blocked = coalesce(p_link_blocked, setting.link_blocked),
    forbidden_words = coalesce(p_forbidden_words, setting.forbidden_words),
    chat_rule_text = case when p_chat_rule_text is null then setting.chat_rule_text else p_chat_rule_text end,
    chat_rule_version = case
      when p_chat_rule_text is not null and p_chat_rule_text is distinct from setting.chat_rule_text
        then setting.chat_rule_version + 1
      else setting.chat_rule_version
    end,
    chat_donation_message_enabled = coalesce(p_chat_donation_message_enabled, setting.chat_donation_message_enabled),
    donation_enabled = coalesce(p_donation_enabled, setting.donation_enabled),
    donation_min_amount = coalesce(p_donation_min_amount, setting.donation_min_amount),
    donation_amount_visible = coalesce(p_donation_amount_visible, setting.donation_amount_visible),
    donation_alert_enabled = coalesce(p_donation_alert_enabled, setting.donation_alert_enabled),
    donation_alert_duration_seconds = coalesce(
      p_donation_alert_duration_seconds,
      setting.donation_alert_duration_seconds
    ),
    alert_sound_enabled = coalesce(p_alert_sound_enabled, setting.alert_sound_enabled),
    alert_sound_key = coalesce(p_alert_sound_key, setting.alert_sound_key),
    alert_volume = coalesce(p_alert_volume, setting.alert_volume),
    tts_enabled = coalesce(p_tts_enabled, setting.tts_enabled),
    tts_rate = coalesce(p_tts_rate, setting.tts_rate),
    tts_volume = coalesce(p_tts_volume, setting.tts_volume),
    tts_voice_uri = coalesce(p_tts_voice_uri, setting.tts_voice_uri),
    settlement_demo = coalesce(p_settlement_demo, setting.settlement_demo);

  return public.get_creator_studio_snapshot(p_actor_user_id);
end;
$function$;