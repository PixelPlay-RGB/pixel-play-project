// 랜딩 프리뷰 카드의 포인터 기반 기울기 애니메이션을 렌더링합니다.
"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import type { PointerEvent, ReactNode } from "react";

import { cn } from "@/lib/utils";

const TILT_RANGE = 7;

const TILT_SPRING = {
  stiffness: 240,
  damping: 24,
  mass: 0.35,
};

export function InteractiveTiltFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, TILT_SPRING);
  const springY = useSpring(pointerY, TILT_SPRING);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-TILT_RANGE, TILT_RANGE]);
  const rotateX = useTransform(springY, [-0.5, 0.5], [TILT_RANGE, -TILT_RANGE]);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();

    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <motion.div
      data-tilt-frame
      className={cn(className, "will-change-transform")}
      style={{ rotateX, rotateY }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </motion.div>
  );
}
