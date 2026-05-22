// 랜딩 프리뷰 방송 설정 튜토리얼 단계를 렌더링합니다.
import { motion } from "motion/react";

import { TUTORIAL_STEP_VARIANTS } from "@/lib/framer-motion/landing-preview";
import { cn } from "@/lib/utils";
import type { LandingTutorialStep } from "@/types/preview/landing-preview";

export function TutorialStep({ index, step }: { index: number; step: LandingTutorialStep }) {
  return (
    <motion.div
      custom={index}
      variants={TUTORIAL_STEP_VARIANTS}
      className={cn(
        "flex items-start gap-3 rounded-xl border px-3 py-2.5 sm:rounded-2xl sm:px-3.5 sm:py-3",
        step.active ? "border-live/35 bg-live/10" : "border-border bg-background/65",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
          "text-xs font-black",
          step.active ? "bg-live text-white" : "bg-muted text-muted-foreground",
        )}
      >
        {step.step}
      </span>
      <div>
        <strong className="block text-sm font-extrabold">{step.title}</strong>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed font-semibold">
          {step.description}
        </p>
      </div>
    </motion.div>
  );
}
