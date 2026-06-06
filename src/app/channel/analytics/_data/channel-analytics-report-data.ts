// 채널 지난 방송 분석 페이지의 서버 데이터(종료된 방송 요약)를 조회합니다.
import "server-only";

import { ANALYTICS_REPORT_LIMIT } from "@/constants/channel/analytics";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import type { BroadcastReport } from "@/types/channel/analytics";
import type { AppActionResult } from "@/types/common/action";
import { mapBroadcastReportRow } from "@/utils/channel/channel-analytics-report";

import { resolveAnalyticsActorId } from "./analytics-actor";

export async function getCreatorBroadcastReports(): Promise<AppActionResult<BroadcastReport[]>> {
  const actorId = await resolveAnalyticsActorId();

  if (!actorId) {
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.auth.authInfoNotFound,
    };
  }

  // 본인 creator_id로 좁혀 조회한다(admin client지만 actorId는 인증 유저에서 해석).
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("live_broadcast")
    .select(
      "id, title, started_at, ended_at, chat_message_count, donation_count, donation_amount_total",
    )
    .eq("creator_id", actorId)
    .not("ended_at", "is", null)
    .order("ended_at", { ascending: false })
    .limit(ANALYTICS_REPORT_LIMIT);

  if (error) {
    console.error("지난 방송 분석 조회 실패", error);
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.channel.analyticsLoadFailed,
    };
  }

  const reports = (data ?? [])
    .map(mapBroadcastReportRow)
    .filter((report): report is BroadcastReport => report !== null);

  return { success: true, data: reports };
}
