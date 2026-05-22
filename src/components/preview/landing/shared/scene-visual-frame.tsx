// 랜딩 프리뷰 섹션의 비주얼 카드 프레임을 렌더링합니다.

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { InteractiveTiltFrame } from "./interactive-tilt-frame";

export function SceneVisualFrame({
  children,
  className,
  tilt = false,
}: {
  children: ReactNode;
  className?: string;
  tilt?: boolean;
}) {
  const frameClassName = cn(
    "border-border bg-card overflow-hidden rounded-3xl border",
    "shadow-2xl shadow-black/40",
    !tilt && className,
  );

  if (tilt) {
    return (
      <div className={cn("w-full perspective-[1400px]", className)}>
        <InteractiveTiltFrame className={cn(frameClassName, "w-full transform-3d")}>
          {children}
        </InteractiveTiltFrame>
      </div>
    );
  }

  return <div className={frameClassName}>{children}</div>;
}
