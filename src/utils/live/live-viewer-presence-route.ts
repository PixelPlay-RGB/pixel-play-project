// 시청자 하트비트 sync/leave 라우트의 공통 골격 — fetch/sendBeacon이 보낸 { broadcastId }를
// 관대하게 파싱해 주어진 액션에 위임하고 204를 반환한다. 신원(로그인 세션·익명 쿠키)은 액션이
// 서버에서 직접 해석·발급하므로 라우트는 broadcastId만 다룬다(비정상 본문은 부수효과라 무시).
import { NextResponse, type NextRequest } from "next/server";

export function createViewerPresenceRouteHandler(action: (broadcastId: string) => Promise<void>) {
  return async function POST(request: NextRequest) {
    let broadcastId: unknown;

    try {
      const body: unknown = await request.json();
      if (body && typeof body === "object") {
        broadcastId = (body as Record<string, unknown>).broadcastId;
      }
    } catch {
      // 비정상 본문은 조용히 무시한다(부수효과라 화면 영향 없음).
    }

    if (typeof broadcastId === "string") {
      await action(broadcastId);
    }

    return new NextResponse(null, { status: 204 });
  };
}
