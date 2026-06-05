"use server";
// 채널 소개(bio) 저장 mutation을 처리합니다.

import { getAuthenticatedActorId } from "@/actions/common/authenticated-actor";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import {
  channelProfileSettingsSchema,
  type ChannelProfileSettingsInput,
} from "@/lib/zod/channel-profile";
import type { ChannelProfile } from "@/types/channel/channel";
import type { AppActionResult } from "@/types/common/action";
import { parseChannelProfile } from "@/utils/channel/channel-parser";

const SAVE_FAILED_CODE = APP_MESSAGE_CODE.error.channel.channelProfileSaveFailed;

export async function updateChannelProfileAction(
  input: ChannelProfileSettingsInput,
): Promise<AppActionResult<ChannelProfile>> {
  const parsed = channelProfileSettingsSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, code: SAVE_FAILED_CODE };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "채널 정보 저장 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("update_channel_profile", {
    p_actor_user_id: actor.userId,
    p_channel_bio: parsed.data.bio,
  });

  if (error) {
    console.error("채널 정보 저장 실패", error);
    return { success: false, code: SAVE_FAILED_CODE };
  }

  const profile = parseChannelProfile(data, actor.userId);

  if (!profile) {
    return { success: false, code: SAVE_FAILED_CODE };
  }

  return {
    success: true,
    data: profile,
    code: APP_MESSAGE_CODE.success.channel.channelProfileSaved,
  };
}
