// 랜딩 프리뷰 섹션의 작은 키커 라벨을 렌더링합니다.
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { LandingKickerTone } from "@/types/preview/landing-preview";

export function SceneKicker({ tone, children }: { tone: LandingKickerTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-2",
        "rounded-full border px-3 py-1.5 text-xs font-extrabold tracking-wider uppercase",
        tone === "brand" && "border-brand/30 bg-brand/10 text-brand",
        tone === "live" && "border-live/30 bg-live/10 text-live",
        tone === "violet" && "border-violet-500/30 bg-violet-500/10 text-violet-400",
      )}
    >
      {children}
    </span>
  );
}
