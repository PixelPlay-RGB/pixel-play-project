// 랜딩 프리뷰 섹션의 설명 문구와 bullet 목록을 렌더링합니다.
import { Fragment } from "react";

import { SceneKicker } from "@/components/preview/landing/shared/scene-kicker";
import { cn } from "@/lib/utils";
import type { LandingSceneCopy } from "@/types/preview/landing-preview";

export function SceneCopy({ copy }: { copy: LandingSceneCopy }) {
  return (
    <div className="flex flex-col">
      <SceneKicker tone={copy.kickerTone}>{copy.kicker}</SceneKicker>
      <h3 className={cn("mt-4 text-3xl leading-tight font-black tracking-tighter", "sm:text-5xl")}>
        {copy.titleLines.map((line, index) => (
          <Fragment key={line}>
            {line}
            {index < copy.titleLines.length - 1 && <br />}
          </Fragment>
        ))}
      </h3>
      <p className="text-muted-foreground mt-4 max-w-md text-sm leading-relaxed font-medium whitespace-pre-wrap sm:mt-5 sm:text-lg">
        {copy.description}
      </p>
      <ul className="mt-5 flex flex-col gap-2.5 sm:mt-7 sm:gap-3.5">
        {copy.bullets.map((bullet, index) => (
          <li key={`${bullet.strong}-${index}`} className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                "bg-brand/15 text-brand text-xs font-black",
              )}
            >
              ✓
            </span>
            <p className="text-muted-foreground text-xs leading-relaxed font-semibold sm:text-sm">
              <b className="text-foreground font-extrabold">{bullet.strong}</b>
              {bullet.rest}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
