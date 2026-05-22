// 랜딩 프리뷰 첫 화면 섹션을 조립합니다.
import { HeroContent } from "@/components/preview/landing/sections/hero/hero-content";
import { HeroVisual } from "@/components/preview/landing/sections/hero/hero-visual";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section
      data-landing-section="hero"
      className={cn(
        "relative flex min-h-svh w-full items-center overflow-hidden border-b",
        "border-transparent",
        "px-6 py-32 sm:px-10 lg:px-50",
      )}
    >
      <div
        className={cn("relative z-10 grid w-full items-center gap-12", "lg:grid-cols-2 lg:gap-20")}
      >
        <HeroContent />
        <HeroVisual />
      </div>
    </section>
  );
}
