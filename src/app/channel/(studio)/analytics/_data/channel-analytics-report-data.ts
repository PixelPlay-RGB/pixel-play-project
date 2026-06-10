// 채널 지난 방송 분석 페이지의 서버 데이터(종료된 방송 요약)를 조회합니다.
import "server-only";

import { ANALYTICS_REPORT_LIMIT, REPORT_PERIOD_DEFAULT } from "@/constants/channel/analytics";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import type {
  BroadcastReport,
  BroadcastReportPayload,
  BroadcastReportPeriod,
} from "@/types/channel/analytics";
import type { AppActionResult } from "@/types/common/action";
import {
  getReportPeriodStartIso,
  mapBroadcastReportRow,
} from "@/utils/channel/channel-analytics-report";

import { resolveAnalyticsActorId } from "./analytics-actor";

export async function getCreatorBroadcastReports(
  period: BroadcastReportPeriod = REPORT_PERIOD_DEFAULT,
): Promise<AppActionResult<BroadcastReportPayload>> {
  const actorId = await resolveAnalyticsActorId();

  if (!actorId) {
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.auth.authInfoNotFound,
    };
  }

  // 본인 creator_id로 좁혀 조회한다(admin client지만 actorId는 인증 유저에서 해석).
  const supabase = createAdminClient();
  let query = supabase
    .from("live_broadcast")
    .select(
      "id, title, thumbnail_url, started_at, ended_at, peak_viewer_count, donation_count, donation_amount_total",
    )
    .eq("creator_id", actorId)
    .not("ended_at", "is", null);

  // 기간 프리셋이 "전체"가 아니면 종료 시각 하한을 건다.
  const startIso = getReportPeriodStartIso(period);
  if (startIso) {
    query = query.gte("ended_at", startIso);
  }

  const { data, error } = await query
    // ended_at 동률 시 순서가 흔들리지 않도록 id를 2차 정렬키로 고정한다(결정적 순서).
    .order("ended_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(ANALYTICS_REPORT_LIMIT);

  if (error) {
    console.error("지난 방송 분석 조회 실패", error);
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.channel.analyticsLoadFailed,
    };
  }

  const rows = data ?? [];
  const { byBroadcast, total } = await collectChatParticipants(
    supabase,
    rows.map((row) => row.id),
  );

  const reports = rows
    .map((row) => mapBroadcastReportRow(row, byBroadcast.get(row.id) ?? 0))
    .filter((report): report is BroadcastReport => report !== null);

  return { success: true, data: { reports, totalChatParticipants: total } };
}

// 종료된 방송들의 채팅 고유 참여자 수를 집계 RPC로 조회한다.
// RPC가 message_type='chat'으로 좁혀 count(distinct sender_id)를 DB에서 수행하므로
// JS distinct + 행 상한(언더카운트)이 사라진다. GROUPING SETS로 방송별 카운트와
// 기간 전체 합집합(broadcast_id=null 행)을 한 번에 받는다.
// 집계 실패는 화면 전체를 막지 않고 0으로 graceful 처리한다.
async function collectChatParticipants(
  supabase: ReturnType<typeof createAdminClient>,
  broadcastIds: string[],
): Promise<{ byBroadcast: Map<string, number>; total: number }> {
  const byBroadcast = new Map<string, number>();

  if (broadcastIds.length === 0) {
    return { byBroadcast, total: 0 };
  }

  const { data, error } = await supabase.rpc("get_creator_broadcast_chat_participants", {
    p_broadcast_ids: broadcastIds,
  });

  if (error) {
    console.error("지난 방송 채팅 참여자 집계 실패", error);
    return { byBroadcast, total: 0 };
  }

  let total = 0;
  for (const row of data ?? []) {
    // broadcast_id가 null인 행은 GROUPING SETS의 합계 행 = 기간 전체 합집합 참여자.
    // (타입 생성기는 non-null로 추론하나 합계 행은 null이라 좁혀서 처리한다.)
    const broadcastId = row.broadcast_id as string | null;
    if (broadcastId === null) {
      total = row.participant_count;
      continue;
    }
    byBroadcast.set(broadcastId, row.participant_count);
  }

  return { byBroadcast, total };
}
