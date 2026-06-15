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

  // 헤더·푸터 없이 화면을 꽉 채운다(팝업·직접 진입 모두 동일). 카드/여백 없이 ClipEditorView가
  // 풀블리드로 내부를 구성한다.
  return (
    <div className="flex flex-1 flex-col">
      <ClipEditorView creatorId={creatorId} />
    </div>
  );
}
