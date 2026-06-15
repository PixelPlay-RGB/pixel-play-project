// 시청자 하트비트 sync/leave 라우트의 공통 골격 — fetch/sendBeacon이 보낸 { broadcastId }를
// 관대하게 파싱해 주어진 액션에 위임하고 204를 반환한다. 신원(로그인 세션·익명 쿠키)은 액션이
// 서버에서 직접 해석·발급하므로 라우트는 broadcastId만 다룬다(비정상 본문은 부수효과라 무시).
//
// TODO(#97 후속): 두 라우트는 비인증 공개 POST라 쿠키를 비우는 클라이언트의 윈도 내 과집계나
// 단순 POST flood가 service-role RPC write를 그대로 증폭시킬 수 있다. per-IP/origin 레이트리밋·
// edge-level shedding은 MVP 범위 밖 별도 인프라 작업으로 둔다(여기 공용 유틸이 아닌 인프라 계층 담당).
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
      // action은 스스로 예외를 삼키는 부수효과 계약을 따른다(runLiveViewerPresenceRpc의 내부
      // try/catch). 그래서 여기서 다시 감싸지 않아도 항상 204 응답 불변식이 유지된다.
      await action(broadcastId);
    }

    return new NextResponse(null, { status: 204 });
  };
}
