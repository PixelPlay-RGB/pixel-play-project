"use client";
// PIP(미니플레이어)로 전환했을 때 시청 페이지의 원래 비디오 자리에 남기는 안내.
// 같은 16:9 자리를 유지해 채팅·정보 행 레이아웃이 흔들리지 않게 하고, 미니로 시청 중임을
// 알리며 인라인 재생으로 즉시 복귀하는 버튼을 둔다(같은 페이지라 네비 없이 상태 전환만).

import { PictureInPicture2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LIVE_LABEL } from "@/constants/live/live";

interface Props {
  onReturn: () => void;
}

export function LivePipPlaceholder({ onReturn }: Props) {
  return (
    <div className="bg-muted/40 relative flex aspect-video w-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="bg-background/70 text-muted-foreground flex size-14 items-center justify-center rounded-full">
        <PictureInPicture2 className="size-7" />
      </div>
      <div className="space-y-1">
        <p className="text-foreground text-sm font-semibold">{LIVE_LABEL.pipActiveTitle}</p>
        <p className="text-muted-foreground text-xs">{LIVE_LABEL.pipActiveDescription}</p>
      </div>
      <Button type="button" size="sm" variant="secondary" onClick={onReturn}>
        {LIVE_LABEL.pipReturnInline}
      </Button>
    </div>
  );
}
