// 랜딩 프리뷰의 주요 CTA 버튼 묶음을 렌더링합니다.

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { LANDING_CTA_LABELS, LANDING_ROUTES } from "@/constants/preview/landing-preview";
import { cn } from "@/lib/utils";
import { createPathWithNext } from "@/utils/common/redirect";

export function LandingCtaButtons({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      <Link href={LANDING_ROUTES.live}>
        <Button
          size="lg"
          className={cn(
            "h-12 rounded-full px-7 text-base font-bold",
            "bg-live hover:bg-live text-white! hover:text-white! hover:opacity-60",
            "dark:hover:bg-live",
            "shadow-live/30 shadow-lg",
            "transition-all duration-200",
          )}
        >
          {LANDING_CTA_LABELS.live}
        </Button>
      </Link>
      <Link href={LANDING_ROUTES.chat}>
        <Button
          size="lg"
          className={cn(
            "h-12 rounded-full px-7 text-base font-bold",
            "bg-brand hover:bg-brand text-white! hover:text-white! hover:opacity-60",
            "dark:hover:bg-brand",
            "shadow-brand/30 shadow-lg",
            "transition-all duration-200",
          )}
        >
          {LANDING_CTA_LABELS.chat}
        </Button>
      </Link>
      <Link href={createPathWithNext(LANDING_ROUTES.login, LANDING_ROUTES.loginNext)}>
        <Button
          size="lg"
          className={cn(
            "h-12 rounded-full px-7 text-base font-bold",
            "border-border/80 bg-background/40 text-foreground border backdrop-blur",
            "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
            "transition-all duration-200",
          )}
        >
          {LANDING_CTA_LABELS.login}
        </Button>
      </Link>
    </div>
  );
}
