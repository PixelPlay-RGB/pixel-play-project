"use client";
// 채팅방 멤버 avatar의 접속 및 입력 상태 badge를 표시하는 컴포넌트

import { AnimatePresence, motion } from "motion/react";

import {
  chatRoomPresenceBadgeTransition,
  chatRoomPresenceBadgeVariants,
  chatRoomTypingDotAnimation,
  chatRoomTypingDotDelays,
  chatRoomTypingDotTransition,
} from "@/lib/framer-motion/chat-room-presence";
import { cn } from "@/lib/utils";
import type { ChatRoomPresenceStatus } from "@/types/chat-room/chat-room-presence";

interface Props {
  status: ChatRoomPresenceStatus | null;
}

function TypingDots() {
  return (
    <span className="flex items-center justify-center gap-0.5" aria-hidden>
      {chatRoomTypingDotDelays.map((delay) => (
        <motion.span
          key={delay}
          className="bg-primary-foreground size-1 rounded-full"
          animate={chatRoomTypingDotAnimation}
          transition={{
            ...chatRoomTypingDotTransition,
            delay,
          }}
        />
      ))}
    </span>
  );
}

export function MemberPresenceBadge({ status }: Props) {
  return (
    <AnimatePresence initial={false} mode="wait">
      {status && (
        <motion.span
          key={status}
          data-slot="avatar-badge"
          aria-label={status === "typing" ? "메시지 입력 중" : "채팅방 접속 중"}
          title={status === "typing" ? "메시지 입력 중" : "채팅방 접속 중"}
          variants={chatRoomPresenceBadgeVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={chatRoomPresenceBadgeTransition}
          className={cn(
            "ring-background absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full ring-2 select-none",
            status === "typing" ? "bg-brand h-3 w-5 rounded-full" : "size-2.5 bg-emerald-500",
          )}
        >
          {status === "typing" && <TypingDots />}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
