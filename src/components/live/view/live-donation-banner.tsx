"use client";
// 이번 주 후원 랭킹을 채팅 영역 상단 배너로 표시합니다. (접기/펼치기 아코디언)

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, Crown, Medal, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDonationAmount } from "@/utils/live/live-chat";
import { LIVE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";
import type { LiveDonation } from "@/types/live/live";

interface Props {
  donations: LiveDonation[];
}

// 금·은·동 — 숫자 대신 아이콘으로 순위를 표현하고 세 자리 모두 색감을 준다.
const RANK_META = [
  { icon: Crown, color: "text-yellow-500", bg: "border-yellow-400/30 bg-yellow-400/10" },
  { icon: Medal, color: "text-slate-400", bg: "border-slate-400/30 bg-slate-400/10" },
  { icon: Medal, color: "text-amber-600", bg: "border-amber-600/30 bg-amber-600/10" },
] as const;

export function LiveDonationBanner({ donations }: Props) {
  // RPC가 이미 amount 내림차순으로 정렬·상위 3건만 내려준다.
  const top3 = donations.slice(0, 3);
  const [isOpen, setIsOpen] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="border-border bg-card/95 border-b backdrop-blur-sm">
      <div className="flex items-center justify-between px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <Trophy className="text-muted-foreground size-3.5 shrink-0" />
          <span className="text-muted-foreground text-xs leading-none font-medium">
            {LIVE_LABEL.donationRankingTitle}
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-expanded={isOpen}
          aria-label={
            isOpen ? LIVE_LABEL.donationRankingCollapse : LIVE_LABEL.donationRankingExpand
          }
          className="size-6 p-0"
          onClick={() => setIsOpen((value) => !value)}
        >
          <ChevronDown
            className={cn("size-3.5 transition-transform duration-200", !isOpen && "-rotate-180")}
          />
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key="ranking"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2">
              {top3.length === 0 ? (
                <p className="text-muted-foreground text-xs">{LIVE_LABEL.emptyWeeklyDonation}</p>
              ) : (
                <div className="flex items-stretch gap-1.5">
                  <div
                    className={cn(
                      "flex w-1/2 min-w-0 items-center gap-1.5 rounded-md border px-2 py-1",
                      RANK_META[0].bg,
                    )}
                  >
                    <Crown className={cn("size-4 shrink-0 fill-current", RANK_META[0].color)} />
                    <span className="text-foreground min-w-0 flex-1 truncate text-xs font-medium">
                      {top3[0]?.author ?? "-"}
                    </span>
                    <span className="text-live shrink-0 text-sm font-bold">
                      {top3[0] ? `${formatDonationAmount(top3[0].amount)}P` : ""}
                    </span>
                  </div>

                  <div className="flex w-1/2 min-w-0 flex-col gap-1">
                    {([1, 2] as const).map((idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex flex-1 items-center gap-1.5 rounded-md border px-2 py-0.5",
                          RANK_META[idx].bg,
                        )}
                      >
                        <Medal className={cn("size-3.5 shrink-0", RANK_META[idx].color)} />
                        <span className="text-foreground min-w-0 flex-1 truncate text-xs">
                          {top3[idx]?.author ?? "-"}
                        </span>
                        <span className="text-live shrink-0 text-xs font-semibold">
                          {top3[idx] ? `${formatDonationAmount(top3[idx].amount)}P` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
