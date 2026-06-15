// 클립 에디터 라우트 — 라이브 시청 화면 가위 버튼이 연 별도 창(팝업)에서 뜬다(스냅샷·필름은
// store로 전달). 헤더·푸터 없이 풀블리드로 채운다(RouteOverlayChromeController가 크롬을 숨김).
// 생성·처리·완료 전 과정을 ClipEditorView가 소유한다. 인증 필요(미들웨어에서 보호).
import type { Metadata } from "next";

import { ClipEditorView } from "@/components/clip/clip-editor-view";

export const metadata: Metadata = {
  title: "클립 만들기",
  robots: { index: false, follow: false },
};

export default async function ClipEditorPage({
  params,
}: {
  params: Promise<{ creatorId: string }>;
}) {
  const { creatorId } = await params;

  // 헤더·푸터 없이 화면을 꽉 채운다(팝업·직접 진입 모두 동일). `clip-editor-root` 마커는
  // globals.css의 body:has(...)로 SSR 첫 페인트부터 헤더·푸터를 숨긴다(JS 토글의 플래시 없음).
  return (
    <div className="clip-editor-root flex flex-1 flex-col">
      <ClipEditorView creatorId={creatorId} />
    </div>
  );
}
