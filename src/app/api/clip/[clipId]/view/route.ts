// 클립 조회수 증가 엔드포인트.
// Server Action에서 익명 뷰어 쿠키(clip_vk)를 set하면 라우터 캐시가 무효화돼 재생 중 화면이
// 새로고침된다(live viewer-sync와 동일 이유). 그 부작용이 없는 라우트 핸들러로 처리한다.
import { NextResponse, type NextRequest } from "next/server";

import { incrementLiveClipViewCountAction } from "@/actions/clip/clip";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ clipId: string }> },
) {
  const { clipId } = await params;
  // 액션은 스스로 예외를 삼키는 fire-and-forget 계약(증가 실패가 시청을 막지 않는다)이라
  // 여기서 다시 감싸지 않아도 항상 204 응답 불변식이 유지된다.
  await incrementLiveClipViewCountAction(clipId);
  return new NextResponse(null, { status: 204 });
}
