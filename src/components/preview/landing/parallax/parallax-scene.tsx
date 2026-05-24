// 랜딩 프리뷰 parallax 섹션의 스크롤 연동 프레임을 렌더링합니다.
import { motion, useTransform, type MotionValue } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { LandingSceneKey, ScrollRange } from "@/types/preview/landing-preview";
import { mapScrollPeakValue, mapScrollValue } from "@/utils/preview/landing-motion";

export function ParallaxScene({
  scene,
  index,
  scrollY,
  scrollRange,
  children,
}: {
  scene: LandingSceneKey;
  index: number;
  scrollY: MotionValue<number>;
  scrollRange: ScrollRange;
  children: ReactNode;
}) {
  const contentY = useTransform(scrollY, (latest) =>
    mapScrollValue(latest, scrollRange, 200, -200),
  );
  const contentOpacity = useTransform(scrollY, (latest) =>
    mapScrollPeakValue(latest, scrollRange, 0.28, 1, 0.28),
  );

  return (
    <section
      data-landing-section={scene}
      data-parallax-scene={scene}
      data-parallax-stage
      className={cn(
        "top-(--app-header-height) border-t",
        "border-transparent",
        "sticky min-h-(--chat-content-height) overflow-hidden",
        "flex items-center justify-center",
        "px-6 sm:px-10 lg:px-16",
      )}
      style={{ zIndex: index + 1 }}
    >
      <motion.div
        data-parallax-content
        className="relative mx-auto my-auto grid h-full w-full max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        {children}
      </motion.div>
    </section>
  );
}
