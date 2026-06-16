// 클립이 하나도 없을 때의 빈 상태 — 브랜드 톤 아이콘 배지 + 안내 문구.
// 텍스트만 있던 기존 안내를 대신해 채널 클립 탭 등에서 공용으로 쓴다.

import { Clapperboard } from "lucide-react";

import { CLIP_LABEL } from "@/constants/clip/clip";

interface Props {
  title?: string;
  description?: string;
}

export function ClipEmptyState({
  title = CLIP_LABEL.empty,
  description = "라이브 방송에서 인상적인 순간을 클립으로 남겨보세요.",
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <div className="bg-brand/10 text-brand ring-brand/5 flex size-16 items-center justify-center rounded-2xl ring-8">
        <Clapperboard className="size-8" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-foreground text-sm font-bold">{title}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
}
