// 랜딩 프리뷰 히어로 텍스트와 CTA 영역을 조립합니다.
import { HeroBadge } from "@/components/preview/landing/sections/hero/hero-badge";
import { HeroDescription } from "@/components/preview/landing/sections/hero/hero-description";
import { HeroIntroMotion } from "@/components/preview/landing/sections/hero/hero-intro-motion";
import { HeroStatList } from "@/components/preview/landing/sections/hero/hero-stat-list";
import { HeroTitle } from "@/components/preview/landing/sections/hero/hero-title";
import { LandingCtaButtons } from "@/components/preview/landing/shared/landing-cta-buttons";

export function HeroContent() {
  return (
    <HeroIntroMotion>
      <HeroBadge />
      <HeroTitle />
      <HeroDescription />
      <LandingCtaButtons className="mt-10" />
      <HeroStatList />
    </HeroIntroMotion>
  );
}
