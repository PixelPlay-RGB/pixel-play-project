// 랜딩 프리뷰의 마지막 CTA 섹션을 렌더링합니다.
import { motion } from "motion/react";
import { Fragment } from "react";

import { LandingCtaButtons } from "@/components/preview/landing/shared/landing-cta-buttons";
import { LANDING_SECTION_TEXT } from "@/constants/preview/landing-preview";
import { REVEAL_EASE } from "@/lib/framer-motion/landing-preview";
import { cn } from "@/lib/utils";

const FINAL_CTA_COPY = LANDING_SECTION_TEXT.finalCta;

export function FinalCtaScene() {
  return (
    <div className="flex w-full justify-center lg:col-span-2">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, ease: REVEAL_EASE }}
        className={cn(
          "relative z-10 flex w-full max-w-6xl flex-col items-center",
          "px-4 py-14 sm:px-8 sm:py-20",
        )}
      >
        <h2
          className={cn(
            "max-w-3xl text-center text-4xl leading-[1.05] font-black tracking-tighter",
            "sm:text-6xl lg:text-7xl",
          )}
        >
          <span className="text-live">{FINAL_CTA_COPY.titleLines[0]}</span>
          <br />
          <span className="text-brand">{FINAL_CTA_COPY.titleLines[1]}</span>
          <br />
          {FINAL_CTA_COPY.titleLines.slice(2).map((line, index) => (
            <Fragment key={line}>
              <span>{line}</span>
              {index < FINAL_CTA_COPY.titleLines.slice(2).length - 1 && <br />}
            </Fragment>
          ))}
        </h2>
        <p className="text-muted-foreground mt-7 max-w-xl text-center text-base leading-relaxed font-medium sm:text-lg">
          {FINAL_CTA_COPY.descriptionLines.map((line, index) => (
            <Fragment key={line}>
              {line}
              {index < FINAL_CTA_COPY.descriptionLines.length - 1 && <br />}
            </Fragment>
          ))}
        </p>

        <LandingCtaButtons className="mt-10 justify-center" />
      </motion.div>
    </div>
  );
}
