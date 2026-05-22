// 랜딩 프리뷰의 라이브 탐색 섹션을 렌더링합니다.
import { Fragment } from "react";

import { ExploreLiveCard } from "@/components/preview/landing/sections/explore/explore-live-card";
import { SceneKicker } from "@/components/preview/landing/shared/scene-kicker";
import { SectionReveal } from "@/components/preview/landing/shared/section-reveal";
import { LANDING_LIVE_CARDS, LANDING_SECTION_TEXT } from "@/constants/preview/landing-preview";
import { cn } from "@/lib/utils";

const EXPLORE_COPY = LANDING_SECTION_TEXT.explore;

export function ExploreScene() {
  return (
    <div className="flex w-full flex-col lg:col-span-2">
      <SectionReveal direction="up" className="mx-auto max-w-2xl text-center">
        <SceneKicker tone="brand">{EXPLORE_COPY.kicker}</SceneKicker>
        <h3
          className={cn("mt-4 text-4xl leading-tight font-black tracking-tighter", "sm:text-5xl")}
        >
          {EXPLORE_COPY.titleLines.map((line, index) => (
            <Fragment key={line}>
              {line}
              {index < EXPLORE_COPY.titleLines.length - 1 && <br />}
            </Fragment>
          ))}
        </h3>
        <p className="text-muted-foreground mt-5 text-sm font-medium sm:text-base">
          {EXPLORE_COPY.descriptionLines.map((line, index) => (
            <Fragment key={line}>
              {line}
              {index < EXPLORE_COPY.descriptionLines.length - 1 && <br />}
            </Fragment>
          ))}
        </p>
      </SectionReveal>

      <div className={cn("mt-8 grid w-full grid-cols-2 gap-4", "sm:grid-cols-3 lg:grid-cols-4")}>
        {LANDING_LIVE_CARDS.map((card, index) => (
          <ExploreLiveCard key={card.title} card={card} index={index} />
        ))}
      </div>
    </div>
  );
}
