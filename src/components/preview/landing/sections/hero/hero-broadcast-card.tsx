// 랜딩 프리뷰 히어로 방송 카드 애니메이션을 렌더링합니다.

import { motion } from "motion/react";

import { LivePill } from "@/components/preview/landing/shared/live-pill";
import {
  LANDING_BROADCAST_TITLE,
  LANDING_LIVE_VIEWER_TEXT,
} from "@/constants/preview/landing-preview";
import { cn } from "@/lib/utils";

export function HeroBroadcastCard() {
  return (
    <motion.article
      animate={{ y: [0, -20, 0] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      className={cn(
        "absolute top-[4%] right-[4%] w-[78%]",
        "will-change-transform",
        "border-border bg-card overflow-hidden rounded-2xl border",
        "shadow-2xl shadow-black/40",
      )}
    >
      <div
        className={cn(
          "relative m-3 aspect-video overflow-hidden rounded-xl",
          "via-brand/70 to-live bg-linear-to-br from-emerald-950",
        )}
      >
        <LivePill className="absolute top-3 left-3" />
        <span
          className={cn(
            "absolute top-3 right-3 rounded-full px-2.5 py-1",
            "bg-black/50 text-xs font-bold text-white backdrop-blur",
          )}
        >
          {LANDING_LIVE_VIEWER_TEXT}
        </span>
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
      </div>
      <div className="px-4 pt-1 pb-4">
        <h4 className="text-sm font-extrabold tracking-tight">{LANDING_BROADCAST_TITLE}</h4>
        <div className="text-muted-foreground mt-1.5 flex items-center gap-2 text-xs font-bold">
          <span className="from-brand to-live size-4 rounded-full bg-linear-to-br" />
          <b className="text-foreground font-extrabold">하린</b> · 토크 · 32분째 방송 중
        </div>
      </div>
    </motion.article>
  );
}
