// 시청 페이지를 떠날 때(탭 닫기·새로고침·외부 이동) navigator.sendBeacon이 호출하는 하트비트 제거 엔드포인트.
// React effect cleanup은 SPA 내부 이동에서만 보장되고 hard unload에선 요청이 중단되므로, pagehide에서
// 이 라우트로 즉시 leave를 보내 cron sweep(최대 30초) 이전에 현재 시청자 수를 줄인다(부수효과라 실패는 무시).
// 신원은 액션이 쿠키(로그인 세션 또는 pp_anon_viewer)로 직접 해석한다 — sendBeacon은 동일 출처라 쿠키를 포함한다.
import { leaveLiveViewerPresenceAction } from "@/actions/live/live";
import { createViewerPresenceRouteHandler } from "@/utils/live/live-viewer-presence-route";

export const dynamic = "force-dynamic";

export const POST = createViewerPresenceRouteHandler(leaveLiveViewerPresenceAction);
