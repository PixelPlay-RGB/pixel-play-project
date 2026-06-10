"use client";
// 방송 운영 좌측 칼럼의 설정 섹션 — 제목 헤더 + motion 아코디언으로 접고 펼친다.
// (후원 랭킹 배너와 같은 height 0↔auto 패턴)

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  // 제목 옆 보조 표시(상태 뱃지 등).
  headerExtra?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  // 본문 영역 클래스(패딩 등). 기본은 좌우 패딩 + 하단 패딩.
  contentClassName?: string;
}

export function ChannelLiveCollapsibleSection({
  title,
  headerExtra,
  children,
  defaultOpen = true,
  contentClassName,
}: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="border-border border-b">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-foreground truncate text-sm font-bold">{title}</h2>
          {headerExtra}
        </div>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-expanded={isOpen}
          aria-label={isOpen ? `${title} 접기` : `${title} 펼치기`}
          onClick={() => setIsOpen((value) => !value)}
        >
          <ChevronDown
            className={cn("size-4 transition-transform duration-200", !isOpen && "-rotate-180")}
          />
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className={cn("px-4 pb-4", contentClassName)}>{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
