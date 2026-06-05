"use server";
// 채널 후원 설정 저장 mutation을 처리합니다.

import { getAuthenticatedActorId } from "@/actions/common/authenticated-actor";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import {
  channelDonationSettingsSchema,
  type ChannelDonationSettingsInput,
} from "@/lib/zod/channel-donation";
import type { ChannelDonationSnapshot } from "@/types/channel/donation";
import type { AppActionResult } from "@/types/common/action";
import { buildChannelDonationSnapshot } from "@/utils/channel/channel-donation-snapshot";

const CHANNEL_DONATION_SAVE_FAILED_CODE = APP_MESSAGE_CODE.error.channel.donationSettingsSaveFailed;

export async function updateChannelDonationSettingsAction(
  input: ChannelDonationSettingsInput,
): Promise<AppActionResult<ChannelDonationSnapshot>> {
  const parsed = channelDonationSettingsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      code: CHANNEL_DONATION_SAVE_FAILED_CODE,
    };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "채널 후원 설정 저장 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return {
      success: false,
      code: actor.result.code,
    };
  }

  const values = parsed.data;
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("upsert_creator_studio_setting", {
    p_actor_user_id: actor.userId,
    p_donation_enabled: values.donationEnabled,
    p_donation_min_amount: values.donationMinAmount,
    p_donation_amount_visible: values.donationAmountVisible,
    p_donation_alert_duration_seconds: values.donationAlertDurationSeconds,
    p_alert_sound_enabled: values.alertSoundEnabled,
    p_alert_sound_key: values.alertSoundKey,
    p_alert_volume: values.alertVolume,
    p_tts_enabled: values.ttsEnabled,
    p_tts_rate: values.ttsRate,
    p_tts_volume: values.ttsVolume,
    p_tts_voice_uri: values.ttsVoiceUri,
  });

  if (error) {
    console.error("채널 후원 설정 저장 실패", error);
    return {
      success: false,
      code: CHANNEL_DONATION_SAVE_FAILED_CODE,
    };
  }

  try {
    return {
      success: true,
      data: buildChannelDonationSnapshot(actor.userId, data),
      code: APP_MESSAGE_CODE.success.channel.donationSettingsSaved,
    };
  } catch (error) {
    console.error("채널 후원 설정 저장 응답 표시값 생성 실패", error);
    return {
      success: false,
      code: CHANNEL_DONATION_SAVE_FAILED_CODE,
    };
  }
}
