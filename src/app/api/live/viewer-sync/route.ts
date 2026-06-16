// 시청 중 주기적으로(use-live-viewer-presence) 호출돼 하트비트를 갱신하는 엔드포인트.
// 익명 시청자 식별 쿠키(pp_anon_viewer)를 서버가 발급·검증하는데, Server Action에서 쿠키를
// set하면 라우터 캐시가 무효화돼 재생 중 화면이 새로고침되므로 그 부작용이 없는 라우트 핸들러로 처리한다.
import { syncLiveViewerPresenceAction } from "@/actions/live/live";
import { createViewerPresenceRouteHandler } from "@/utils/live/live-viewer-presence-route";

export const dynamic = "force-dynamic";

export const POST = createViewerPresenceRouteHandler(syncLiveViewerPresenceAction);
