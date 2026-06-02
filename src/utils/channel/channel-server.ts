// 공개 채널 프로필 서버 조회 로직입니다. (채널 셸 layout에서 사용)
import "server-only";

import { cache } from "react";

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import type { AppActionResult } from "@/types/common/action";
import type { ChannelProfile } from "@/types/channel/channel";
import { resolveViewerId } from "@/utils/auth/viewer";
import { parseChannelProfile } from "@/utils/channel/channel-parser";

// 같은 요청 안의 generateMetadata + layout 중복 호출을 dedupe합니다.
export const getChannelProfile = cache(async function getChannelProfile(
  creatorId: string,
): Promise<AppActionResult<ChannelProfile>> {
  const viewerId = await resolveViewerId();
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("get_channel_profile", {
    p_creator_id: creatorId,
    p_viewer_id: viewerId ?? undefined,
  });

  if (error) {
    console.error("채널 프로필 조회 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.community.loadFailed };
  }

  const parsed = parseChannelProfile(data, viewerId);

  if (!parsed) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.notFoundPage };
  }

  return { success: true, data: parsed };
});
