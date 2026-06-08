// 채널 실시간 통계 페이지의 서버 데이터를 조회합니다.
import "server-only";

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import type { ChannelAnalyticsSnapshot } from "@/types/channel/analytics";
import type { AppActionResult } from "@/types/common/action";
import { buildChannelAnalyticsSnapshot } from "@/utils/channel/channel-analytics-snapshot";

import { resolveAnalyticsActorId } from "./analytics-actor";

export async function getChannelAnalyticsSnapshot(): Promise<
  AppActionResult<ChannelAnalyticsSnapshot>
> {
  const actorId = await resolveAnalyticsActorId();

  if (!actorId) {
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.auth.authInfoNotFound,
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("get_creator_studio_snapshot", {
    p_actor_user_id: actorId,
  });

  if (error) {
    console.error("채널 통계 조회 실패", error);
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.channel.analyticsLoadFailed,
    };
  }

  try {
    return {
      success: true,
      data: buildChannelAnalyticsSnapshot(actorId, data),
    };
  } catch (error) {
    console.error("채널 통계 표시값 생성 실패", error);
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.channel.analyticsLoadFailed,
    };
  }
}
