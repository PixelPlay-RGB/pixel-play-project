// 랜딩 프리뷰의 방송 설정 섹션을 렌더링합니다.
import { motion } from "motion/react";

import { TutorialStep } from "@/components/preview/landing/sections/creator/tutorial-step";
import { SectionReveal } from "@/components/preview/landing/shared/section-reveal";
import { SceneCopy } from "@/components/preview/landing/shared/scene-copy";
import { SceneVisualFrame } from "@/components/preview/landing/shared/scene-visual-frame";
import { LANDING_SECTION_TEXT, LANDING_TUTORIAL_STEPS } from "@/constants/preview/landing-preview";
import { cn } from "@/lib/utils";

const CREATOR_COPY = LANDING_SECTION_TEXT.creator;

export function CreatorScene() {
  return (
    <>
      <SectionReveal direction="left">
        <SceneCopy copy={CREATOR_COPY} />
      </SectionReveal>

      <SectionReveal direction="right" className="w-full max-w-lg justify-self-end">
        <SceneVisualFrame tilt>
          <div
            className={cn(
              "flex flex-col gap-3 p-4 sm:gap-4 sm:p-5",
              "from-live/10 via-card to-brand/10 bg-linear-to-br",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-live text-[0.625rem] font-black tracking-wider uppercase">
                  {CREATOR_COPY.tutorialLabel}
                </span>
                <h4 className="mt-1 text-xl leading-tight font-black tracking-tight sm:text-2xl">
                  {CREATOR_COPY.tutorialTitleLines.map((line, index) => (
                    <span key={line}>
                      {line}
                      {index < CREATOR_COPY.tutorialTitleLines.length - 1 && <br />}
                    </span>
                  ))}
                </h4>
              </div>
              <span className="bg-live flex h-9 shrink-0 items-center rounded-xl px-3 text-xs font-black text-white">
                {CREATOR_COPY.tutorialBadge}
              </span>
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.35 }}
              className="flex flex-col gap-2.5"
            >
              {LANDING_TUTORIAL_STEPS.map((step, index) => (
                <TutorialStep key={step.step} index={index} step={step} />
              ))}
            </motion.div>

            <div className="border-border bg-card rounded-2xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <strong className="block text-sm font-extrabold">
                    {CREATOR_COPY.readyTitle}
                  </strong>
                  <p className="text-muted-foreground mt-1 text-xs font-semibold">
                    {CREATOR_COPY.readyDescription}
                  </p>
                </div>
                <span className="bg-live rounded-xl px-3 py-2 text-xs font-black text-white">
                  {CREATOR_COPY.readyAction}
                </span>
              </div>
            </div>
          </div>
        </SceneVisualFrame>
      </SectionReveal>
    </>
  );
}
