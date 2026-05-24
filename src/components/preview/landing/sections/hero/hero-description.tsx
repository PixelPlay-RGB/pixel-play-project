// 랜딩 프리뷰 히어로 설명 문구를 렌더링합니다.
import { Fragment } from "react";

import { LANDING_SECTION_TEXT } from "@/constants/preview/landing-preview";
import { cn } from "@/lib/utils";

const HERO_DESCRIPTION_LINES = LANDING_SECTION_TEXT.hero.descriptionLines;

export function HeroDescription() {
  return (
    <p
      className={cn(
        "mt-8 max-w-lg text-base leading-relaxed font-medium",
        "text-muted-foreground sm:text-lg",
      )}
    >
      {HERO_DESCRIPTION_LINES.map((line, index) => (
        <Fragment key={line}>
          {line}
          {index < HERO_DESCRIPTION_LINES.length - 1 && <br />}
        </Fragment>
      ))}
    </p>
  );
}
