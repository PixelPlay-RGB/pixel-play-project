"use client";
// 클립 에디터 모달 셸 — 인터셉팅 라우트(@modal)가 라이브 위에 띄우는 팝업.
// Base UI Dialog의 포커스 트랩·ESC·백드롭을 쓰되 자체 chrome은 중화하고(투명·여백 0),
// ClipEditorView가 자기 카드를 그대로 팝업으로 보여준다. 닫으면 진입 직전(라이브)으로 복귀.

import { useRouter } from "next/navigation";

import { ClipEditorView } from "@/components/clip/clip-editor-view";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Props {
  creatorId: string;
}

export function ClipEditorModal({ creatorId }: Props) {
  const router = useRouter();

  return (
    <Dialog
      defaultOpen
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      <DialogContent
        showCloseButton={false}
        // 기본 chrome 중화 — 카드 모양은 ClipEditorView가 갖는다.
        className="block max-h-[90vh] gap-0 overflow-y-auto rounded-none border-0 bg-transparent p-0 shadow-none ring-0 sm:max-w-3xl"
      >
        <ClipEditorView creatorId={creatorId} onClose={() => router.back()} />
      </DialogContent>
    </Dialog>
  );
}
