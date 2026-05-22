// 랜딩 프리뷰 히어로 상단 상태 배지를 렌더링합니다.
import { LANDING_SECTION_TEXT } from "@/constants/preview/landing-preview";
import { cn } from "@/lib/utils";

export function HeroBadge() {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-2",
        "border-brand/30 bg-brand/10 rounded-full border",
        "text-brand px-3 py-1.5 text-xs font-extrabold",
      )}
    >
      <span className="relative flex size-1.5">
        <span className="bg-live absolute inline-flex size-full animate-ping rounded-full opacity-75" />
        <span className="bg-live relative inline-flex size-1.5 rounded-full" />
      </span>
      {LANDING_SECTION_TEXT.hero.badge}
    </span>
  );
}
