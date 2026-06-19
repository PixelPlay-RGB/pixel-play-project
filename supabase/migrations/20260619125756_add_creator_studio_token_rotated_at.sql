-- CSEC-002: creator_studio_setting에 토큰별 "마지막 재발급 시각" 컬럼 추가(nullable = 재발급 이력 없음).
alter table public.creator_studio_setting
  add column if not exists stream_key_rotated_at timestamptz,
  add column if not exists chat_overlay_rotated_at timestamptz,
  add column if not exists donation_alert_rotated_at timestamptz;

-- 재발급 RPC: 버전 증가와 함께 해당 토큰의 재발급 시각(now())을 같은 update 문에서 원자적으로 기록한다.
create or replace function public.rotate_live_security_token_version(p_actor_user_id uuid, p_token_kind text)
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
    set stream_key_version = stream_key_version + 1,
        stream_key_rotated_at = now()
    where creator_id = p_actor_user_id
    returning stream_key_version into v_new_version;
  elsif v_token_kind = 'chat_overlay' then
    update public.creator_studio_setting
    set chat_overlay_version = chat_overlay_version + 1,
        chat_overlay_rotated_at = now()
    where creator_id = p_actor_user_id
    returning chat_overlay_version into v_new_version;
  elsif v_token_kind = 'donation_alert' then
    update public.creator_studio_setting
    set donation_alert_version = donation_alert_version + 1,
        donation_alert_rotated_at = now()
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

-- 스튜디오 스냅샷 RPC: settings에 토큰별 마지막 재발급 시각(streamKeyRotatedAt 등)을 포함한다.
create or replace function public.get_creator_studio_snapshot(p_actor_user_id uuid)
 returns jsonb
 language plpgsql
 stable security definer
 set search_path to ''
as $function$
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
      'donationAlertVersion', coalesce(setting.donation_alert_version, 1),
      'streamKeyRotatedAt', setting.stream_key_rotated_at,
      'chatOverlayRotatedAt', setting.chat_overlay_rotated_at,
      'donationAlertRotatedAt', setting.donation_alert_rotated_at
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
    where donation.creator_id = creator.id
      and donation.created_at >= (date_trunc('month', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul')
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
