// 랜딩 프리뷰 히어로 방송 준비 카드 애니메이션을 렌더링합니다.

import { motion } from "motion/react";
import { Fragment } from "react";

import { LANDING_SECTION_TEXT } from "@/constants/preview/landing-preview";
import { cn } from "@/lib/utils";

const HERO_COPY = LANDING_SECTION_TEXT.hero;

export function HeroReadyCard() {
  return (
    <motion.article
      animate={{ y: [0, -15, 0] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: -1.8 }}
      className={cn(
        "absolute top-[38%] right-0 w-60 p-4",
        "will-change-transform",
        "border-live/40 rounded-2xl border",
        "from-live/20 via-card to-brand/10 bg-linear-to-br",
        "shadow-live/20 shadow-2xl",
      )}
    >
      <span className="text-live inline-flex items-center gap-1.5 text-xs font-black tracking-wider uppercase">
        {HERO_COPY.readyLabel}
      </span>
      <div className="mt-2 text-3xl leading-none font-black tracking-tighter">
        {HERO_COPY.readyTime}
        <em className="ml-1 text-base font-bold not-italic opacity-70">{HERO_COPY.readySuffix}</em>
      </div>
      <p className="text-muted-foreground mt-1.5 text-xs font-semibold">
        {HERO_COPY.readyDescriptionLines.map((line, index) => (
          <Fragment key={line}>
            {line}
            {index < HERO_COPY.readyDescriptionLines.length - 1 && <br />}
          </Fragment>
        ))}
      </p>
    </motion.article>
  );
}
