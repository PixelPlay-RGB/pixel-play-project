// 랜딩 프리뷰 라이브 탐색 카드를 렌더링합니다.
import { motion } from "motion/react";

import { LivePill } from "@/components/preview/landing/shared/live-pill";
import { REVEAL_EASE } from "@/lib/framer-motion/landing-preview";
import { cn } from "@/lib/utils";
import type { LandingLiveCard } from "@/types/preview/landing-preview";

export function ExploreLiveCard({ card, index }: { card: LandingLiveCard; index: number }) {
  return (
    <motion.article
      initial={{ scale: 0.96 }}
      animate={{ scale: 1 }}
      whileHover={{ y: -6 }}
      className="cursor-pointer"
      transition={{ delay: index * 0.05, duration: 0.45, ease: REVEAL_EASE }}
    >
      <div
        className={cn(
          "relative aspect-video overflow-hidden rounded-xl",
          "bg-linear-to-br",
          card.tone,
        )}
      >
        <LivePill className="absolute top-3 left-3" />
        <span
          className={cn(
            "absolute top-3 right-3 rounded-full px-2 py-1",
            "bg-black/55 text-xs font-bold text-white backdrop-blur",
          )}
        >
          {card.viewers}
        </span>
        <div className="absolute inset-0 bg-linear-to-t from-black/55 to-transparent" />
      </div>
      <h4 className="mt-3 line-clamp-2 text-sm leading-snug font-extrabold tracking-tight">
        {card.title}
      </h4>
      <p className="text-muted-foreground mt-1 text-xs font-bold">{card.creator}</p>
    </motion.article>
  );
}
