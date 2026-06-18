// 선택한 크롭 위치의 9:16 미리보기 — 스냅샷을 background-position으로만 이동시켜
// 캔버스 재계산 없이 실시간으로 따라간다(percentage position은 크롭 의미와 정확히 일치).

import { CLIP_LABEL } from "@/constants/clip/clip";
import { cn } from "@/lib/utils";

interface Props {
  snapshotDataUrl: string | null;
  cropXFraction: number;
  className?: string;
}

export function ClipVerticalPreview({ snapshotDataUrl, cropXFraction, className }: Props) {
  return (
    <div className={cn("flex shrink-0 flex-col items-center gap-1.5", className)}>
      <div
        className="bg-muted aspect-[9/16] w-full overflow-hidden rounded-lg"
        aria-hidden
        style={
          snapshotDataUrl
            ? {
                backgroundImage: `url(${snapshotDataUrl})`,
                backgroundSize: "auto 100%",
                backgroundPositionX: `${cropXFraction * 100}%`,
                backgroundPositionY: "center",
              }
            : undefined
        }
      />
      <span className="text-muted-foreground text-xs">{CLIP_LABEL.preview}</span>
    </div>
  );
}
