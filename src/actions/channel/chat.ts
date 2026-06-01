"use server";
// 채널 채팅 설정 저장 mutation을 처리합니다.

import { getAuthenticatedActorId } from "@/actions/common/authenticated-actor";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { channelChatSettingsSchema, type ChannelChatSettingsInput } from "@/lib/zod/channel-chat";
import type { ChannelChatSnapshot } from "@/types/channel/chat";
import type { AppActionResult } from "@/types/common/action";
import { buildChannelChatSnapshot } from "@/utils/channel/channel-chat-snapshot";

const CHANNEL_CHAT_SAVE_FAILED_CODE = APP_MESSAGE_CODE.error.channel.chatSettingsSaveFailed;

export async function updateChannelChatSettingsAction(
  input: ChannelChatSettingsInput,
): Promise<AppActionResult<ChannelChatSnapshot>> {
  const parsed = channelChatSettingsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      code: CHANNEL_CHAT_SAVE_FAILED_CODE,
    };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "채널 채팅 설정 저장 중 인증 유저 조회 실패",
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
    p_chat_scope: values.chatScope,
    p_follower_wait_seconds: values.followerWaitSeconds,
    p_slow_mode_enabled: values.slowModeEnabled,
    p_slow_mode_seconds: values.slowModeSeconds,
    p_link_blocked: values.linkBlocked,
    p_forbidden_words: values.forbiddenWords,
    p_chat_rule_text: values.chatRuleText,
    p_chat_donation_message_enabled: values.chatDonationMessageEnabled,
  });

  if (error) {
    console.error("채널 채팅 설정 저장 실패", error);
    return {
      success: false,
      code: CHANNEL_CHAT_SAVE_FAILED_CODE,
    };
  }

  try {
    return {
      success: true,
      data: buildChannelChatSnapshot(actor.userId, data),
      code: APP_MESSAGE_CODE.success.channel.chatSettingsSaved,
    };
  } catch (error) {
    console.error("채널 채팅 설정 저장 응답 표시값 생성 실패", error);
    return {
      success: false,
      code: CHANNEL_CHAT_SAVE_FAILED_CODE,
    };
  }
}
