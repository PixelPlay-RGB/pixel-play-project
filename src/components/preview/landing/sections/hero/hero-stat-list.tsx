// 랜딩 프리뷰 히어로 통계 목록을 렌더링합니다.
import { AnimatedHeroStat } from "@/components/preview/landing/sections/hero/animated-hero-stat";
import { LANDING_HERO_STATS } from "@/constants/preview/landing-preview";

export function HeroStatList() {
  return (
    <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
      {LANDING_HERO_STATS.map((stat) => (
        <AnimatedHeroStat key={stat.label} value={stat.value} label={stat.label} />
      ))}
    </div>
  );
}
