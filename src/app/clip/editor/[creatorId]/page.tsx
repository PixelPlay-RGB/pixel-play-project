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

  return <ClipEditorView creatorId={creatorId} />;
}
