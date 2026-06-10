// 시청 페이지를 떠날 때(탭 닫기·새로고침·외부 이동) navigator.sendBeacon이 호출하는 하트비트 제거 엔드포인트.
// React effect cleanup은 SPA 내부 이동에서만 보장되고 hard unload에선 요청이 중단되므로, pagehide에서
// 이 라우트로 즉시 leave를 보내 cron sweep(최대 30초) 이전에 현재 시청자 수를 줄인다(부수효과라 실패는 무시).
import { NextResponse, type NextRequest } from "next/server";

import { leaveLiveViewerPresenceAction } from "@/actions/live/live";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let broadcastId: unknown;
  let anonViewerKey: unknown;

  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object") {
      broadcastId = (body as Record<string, unknown>).broadcastId;
      anonViewerKey = (body as Record<string, unknown>).anonViewerKey;
    }
  } catch {
    // 비정상 본문은 조용히 무시한다(부수효과라 화면 영향 없음).
  }

  if (typeof broadcastId === "string") {
    // 로그인 여부는 액션이 쿠키로 서버 검증한다(익명 키는 비로그인일 때만 채택). sendBeacon은 동일 출처라 쿠키 포함.
    await leaveLiveViewerPresenceAction(
      broadcastId,
      typeof anonViewerKey === "string" ? anonViewerKey : undefined,
    );
  }

  return new NextResponse(null, { status: 204 });
}
