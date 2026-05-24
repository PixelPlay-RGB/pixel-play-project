// 랜딩 프리뷰의 라이브 시청 섹션을 렌더링합니다.

import { SectionReveal } from "@/components/preview/landing/shared/section-reveal";
import { LivePill } from "@/components/preview/landing/shared/live-pill";
import { PlayerIconButton } from "@/components/preview/landing/shared/player-icon-button";
import { SceneCopy } from "@/components/preview/landing/shared/scene-copy";
import { SceneVisualFrame } from "@/components/preview/landing/shared/scene-visual-frame";
import {
  LANDING_BROADCAST_TITLE,
  LANDING_CREATOR_META,
  LANDING_LIVE_VIEWER_TEXT,
  LANDING_SECTION_TEXT,
} from "@/constants/preview/landing-preview";
import { cn } from "@/lib/utils";

export function LiveScene() {
  return (
    <>
      <SectionReveal direction="left">
        <SceneCopy copy={LANDING_SECTION_TEXT.live} />
      </SectionReveal>

      <SectionReveal direction="right">
        <SceneVisualFrame tilt>
          <div className="flex aspect-video w-full flex-col">
            <div
              className={cn(
                "relative flex-1",
                "to-brand/40 bg-linear-to-br from-emerald-950 via-emerald-900",
              )}
            >
              <div className="absolute inset-x-5 top-5 flex items-center justify-between">
                <LivePill />
                <span
                  className={cn(
                    "rounded-full bg-black/50 px-3 py-1",
                    "text-xs font-bold text-white backdrop-blur",
                  )}
                >
                  {LANDING_LIVE_VIEWER_TEXT}
                </span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className={cn(
                    "flex size-20 items-center justify-center rounded-full",
                    "bg-white/95 text-2xl text-black shadow-2xl",
                  )}
                >
                  ▶
                </div>
              </div>
              <div className="absolute inset-x-5 bottom-5 flex items-center gap-3 text-white">
                <PlayerIconButton>▶</PlayerIconButton>
                <PlayerIconButton>🔊</PlayerIconButton>
                <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/20">
                  <div className="bg-live h-full w-1/4 rounded-full" />
                </div>
                <span className="font-mono text-xs font-bold">LIVE · 32:18</span>
                <PlayerIconButton>HD</PlayerIconButton>
                <PlayerIconButton>⛶</PlayerIconButton>
              </div>
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-black/30" />
            </div>
          </div>
          <div className="border-border flex items-center justify-between border-t p-5">
            <div>
              <strong className="text-sm font-extrabold">{LANDING_BROADCAST_TITLE}</strong>
              <p className="text-muted-foreground mt-0.5 text-xs font-semibold">
                {LANDING_CREATOR_META}
              </p>
            </div>
          </div>
        </SceneVisualFrame>
      </SectionReveal>
    </>
  );
}
