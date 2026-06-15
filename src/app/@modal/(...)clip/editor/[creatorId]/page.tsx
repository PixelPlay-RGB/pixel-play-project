// 인터셉팅 라우트 — 라이브(/live/[creatorId])에서 /clip/editor/[creatorId]로 soft 이동하면
// 이 모달이 @modal 슬롯에 떠 라이브를 떠나지 않고 에디터를 팝업으로 보여준다.
// 하드 로드/직접 진입은 인터셉트되지 않고 standalone 풀페이지(app/clip/editor/...)가 뜬다.
import { ClipEditorModal } from "@/components/clip/clip-editor-modal";

export default async function InterceptedClipEditorPage({
  params,
}: {
  params: Promise<{ creatorId: string }>;
}) {
  const { creatorId } = await params;

  return <ClipEditorModal creatorId={creatorId} />;
}
