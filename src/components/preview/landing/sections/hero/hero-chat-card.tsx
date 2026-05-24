// 랜딩 프리뷰 히어로 채팅 카드 애니메이션을 렌더링합니다.

import { motion } from "motion/react";

import { ChatLine } from "@/components/preview/landing/shared/chat-line";
import { LANDING_HERO_CHAT_LINES } from "@/constants/preview/landing-preview";
import { cn } from "@/lib/utils";

export function HeroChatCard() {
  return (
    <motion.article
      animate={{ y: [0, -20, 0] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: -1.2 }}
      className={cn(
        "absolute bottom-[4%] left-0 w-[60%]",
        "will-change-transform",
        "border-border bg-card overflow-hidden rounded-2xl border",
        "shadow-2xl shadow-black/40",
      )}
    >
      <div className="border-border flex items-center justify-between border-b px-3.5 py-2.5">
        <strong className="text-xs font-extrabold">실시간 채팅</strong>
      </div>
      <div className="flex flex-col gap-2 px-3.5 py-3">
        {LANDING_HERO_CHAT_LINES.map((chatLine) => (
          <ChatLine
            key={chatLine.name}
            name={chatLine.name}
            nameClass={chatLine.color}
            text={chatLine.text}
          />
        ))}
      </div>
    </motion.article>
  );
}
