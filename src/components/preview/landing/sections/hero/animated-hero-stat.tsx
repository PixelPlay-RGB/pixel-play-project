// 랜딩 프리뷰 히어로 통계 count-up 애니메이션을 렌더링합니다.
"use client";

import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { formatNumber } from "@/utils/common/format";

export function AnimatedHeroStat({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.6 });
  const targetValue = Number(value.replaceAll(",", ""));
  const isNumericValue = Number.isFinite(targetValue);
  const [displayValue, setDisplayValue] = useState(isNumericValue ? "0" : value);

  useEffect(() => {
    if (!isInView || !isNumericValue) return;

    let animationFrame = 0;
    const duration = 1200;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextValue = Math.round(targetValue * easedProgress);

      setDisplayValue(formatNumber(nextValue));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(tick);
      }
    };

    animationFrame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, isNumericValue, targetValue]);

  return (
    <div ref={ref} className="flex flex-col gap-1">
      <strong className="text-2xl font-black tracking-tight">{displayValue}</strong>
      <span className="text-muted-foreground text-xs font-bold">{label}</span>
    </div>
  );
}
