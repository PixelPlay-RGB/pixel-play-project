// 랜딩 프리뷰 히어로 제목을 렌더링합니다.
import { Fragment } from "react";

import { LANDING_SECTION_TEXT } from "@/constants/preview/landing-preview";
import { cn } from "@/lib/utils";

const HERO_COPY = LANDING_SECTION_TEXT.hero;

export function HeroTitle() {
  return (
    <h1
      className={cn(
        "mt-6 text-5xl leading-[1.05] font-black tracking-tighter",
        "sm:text-6xl lg:text-7xl",
      )}
    >
      {HERO_COPY.titlePrefixLines.map((line) => (
        <Fragment key={line}>
          {line}
          <br />
        </Fragment>
      ))}
      <span className="from-live text-brand bg-linear-to-br bg-clip-text">
        {HERO_COPY.brandLine}
      </span>
      <br />
      <span className="from-live text-live bg-linear-to-br bg-clip-text">{HERO_COPY.liveLine}</span>
    </h1>
  );
}
