// 공개 랜딩 프리뷰 화면을 조립합니다.

import { HeroSection } from "@/components/preview/landing/sections/hero/hero-section";
import { ParallaxStory } from "@/components/preview/landing/parallax/parallax-story";
import { LandingGlobalAuroraLayer } from "@/components/preview/landing/shared/landing-global-aurora-layer";
import { LandingScrollTopButton } from "@/components/preview/landing/shared/landing-scroll-top-button";
import { LandingSectionScroller } from "@/components/preview/landing/shared/landing-section-scroller";
import { cn } from "@/lib/utils";

export function LandingPreviewView() {
  return (
    <div className={cn("bg-background text-foreground relative isolate w-full overflow-hidden")}>
      <LandingSectionScroller />
      <LandingScrollTopButton />
      <LandingGlobalAuroraLayer />

      <div className="relative z-10">
        <HeroSection />
        <ParallaxStory />
      </div>
    </div>
  );
}
