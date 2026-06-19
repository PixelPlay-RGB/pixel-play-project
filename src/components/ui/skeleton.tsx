"use client";
// 빠른 로딩에서 Skeleton이 번쩍 떴다 사라지는 깜빡임을 막는다 — 마운트 후 짧은 지연이 지난 뒤에만
// 부드럽게 나타나, 데이터가 그 전에 도착하면 Skeleton 자체가 보이지 않는다(지연 노출 패턴).

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils/index";

// 이 시간 안에 끝나는 로딩은 Skeleton을 아예 보여주지 않는다(번쩍임 방지). 넘기면 부드럽게 fade-in.
const SKELETON_REVEAL_DELAY_MS = 250;

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), SKELETON_REVEAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-muted animate-pulse rounded-md transition-opacity duration-200",
        revealed ? "opacity-100" : "opacity-0",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
