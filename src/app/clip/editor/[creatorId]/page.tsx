// 클립 에디터 라우트 — 라이브 시청 화면 가위 버튼에서 진입한다(스냅샷은 store로 전달).
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

  // 직접 진입(하드 로드) — 풀페이지로 카드를 가운데 띄운다. 라이브에서 진입하면 인터셉팅
  // 라우트(@modal)가 같은 카드를 모달로 띄운다.
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <ClipEditorView creatorId={creatorId} />
    </div>
  );
}
