// 채널 지난 방송 분석 페이지의 서버 데이터(종료된 방송 요약)를 조회합니다.
import "server-only";

import {
  ANALYTICS_REPORT_LIMIT,
  REPORT_MESSAGE_FETCH_CAP,
  REPORT_PERIOD_DEFAULT,
} from "@/constants/channel/analytics";
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
    .map((row) => mapBroadcastReportRow(row, byBroadcast.get(row.id)?.size ?? 0))
    .filter((report): report is BroadcastReport => report !== null);

  return { success: true, data: { reports, totalChatParticipants: total } };
}

// 종료된 방송들의 채팅 고유 참여자를 live_message에서 집계한다.
// 방송별 distinct sender + 기간 전체 distinct sender(합집합)를 함께 만든다.
// 참여자 집계 실패는 화면 전체를 막지 않고 0으로 graceful 처리한다.
async function collectChatParticipants(
  supabase: ReturnType<typeof createAdminClient>,
  broadcastIds: string[],
): Promise<{ byBroadcast: Map<string, Set<string>>; total: number }> {
  const byBroadcast = new Map<string, Set<string>>();
  const everyone = new Set<string>();

  if (broadcastIds.length === 0) {
    return { byBroadcast, total: 0 };
  }

  // ⚠️ PostgREST 기본 행 상한(db-max-rows, 보통 1000)이 먼저 걸리므로 실제 수신은
  // min(1000, REPORT_MESSAGE_FETCH_CAP) 행이다. 단일 .in() + 정렬 없음이라 메시지 총합이
  // 상한을 넘으면 일부 방송 메시지가 아예 안 실려, 대형 방송 언더카운트뿐 아니라 후순위
  // 방송 참여자가 0으로 누락될 수 있고 기간 합집합도 그만큼 빠진다.
  // → 정확 집계는 count(distinct) RPC 후속으로 승격(현재는 graceful 근사).
  const { data, error } = await supabase
    .from("live_message")
    .select("broadcast_id, sender_id")
    .in("broadcast_id", broadcastIds)
    .limit(REPORT_MESSAGE_FETCH_CAP);

  if (error) {
    console.error("지난 방송 채팅 참여자 집계 실패", error);
    return { byBroadcast, total: 0 };
  }

  for (const message of data ?? []) {
    if (!message.sender_id) {
      continue;
    }

    everyone.add(message.sender_id);

    let participants = byBroadcast.get(message.broadcast_id);
    if (!participants) {
      participants = new Set<string>();
      byBroadcast.set(message.broadcast_id, participants);
    }
    participants.add(message.sender_id);
  }

  return { byBroadcast, total: everyone.size };
}
