"use client";
// OBS 브라우저 소스에 붙이는 라이브 채팅 출력 화면을 렌더링합니다.
import { HandCoins } from "lucide-react";

import { LiveChatRoleBadge } from "@/components/live/chat/live-chat-role-badge";
import { LiveSubscriptionBadge } from "@/components/live/chat/live-subscription-badge";
import { useLiveChatOverlay } from "@/hooks/live/use-live-chat-overlay";
import { cn } from "@/lib/utils";
import type {
  LiveChatOverlayMessage,
  LiveChatOverlaySnapshot,
} from "@/types/live/live-chat-overlay";
import { formatNumber } from "@/utils/common/format";
import { getLiveChatOverlayNicknameColor } from "@/utils/live/live-chat-overlay-style";

export function LiveChatOverlay({ initialSnapshot }: { initialSnapshot: LiveChatOverlaySnapshot }) {
  const { chatStackRef, visibleItems } = useLiveChatOverlay(initialSnapshot);

  return (
    <main className="live-overlay-root min-h-screen overflow-hidden bg-transparent p-0 text-white">
      <section
        className={cn(
          "relative flex h-screen w-full flex-col justify-end overflow-hidden",
          "bg-transparent px-0 py-3",
        )}
      >
        <div
          ref={chatStackRef}
          className={cn(
            "flex h-full min-h-0 flex-col items-start justify-end gap-2 overflow-hidden",
            "live-chat-overlay-stack",
          )}
        >
          {visibleItems.map((item) => (
            <ChatMessageItem key={item.message.id} message={item.message} />
          ))}
        </div>
      </section>
    </main>
  );
}

function ChatMessageItem({ message }: { message: LiveChatOverlayMessage }) {
  if (message.kind === "donation") {
    return <DonationMessageItem message={message} />;
  }

  const nicknameColor = getLiveChatOverlayNicknameColor(message.author, message.role);

  return (
    <div className="inline-flex max-w-130 items-start gap-1.5 rounded-xl bg-black/50 px-3.5 py-2">
      <MessagePrefix role={message.role} totalMonths={message.subscriptionTotalMonths} />
      <p className="min-w-0 text-3xl leading-9 font-normal wrap-break-word">
        <span
          className={cn("mr-1.5 font-medium", message.tone === "muted" && "text-white/55")}
          style={message.tone === "muted" ? undefined : { color: nicknameColor }}
        >
          {message.author}
        </span>
        {message.content}
      </p>
    </div>
  );
}

function DonationMessageItem({ message }: { message: LiveChatOverlayMessage }) {
  return (
    <p
      className={cn(
        "inline-block max-w-130 rounded-xl px-3.5 py-2 wrap-break-word",
        "bg-live/15 ring-live/35 ring-1",
        "text-3xl leading-9 font-normal",
      )}
    >
      <HandCoins className="text-live mr-1.5 inline size-[1em] align-[-0.12em]" aria-hidden />
      <span className="text-live mr-1.5 font-medium">{message.author}</span>
      {typeof message.amount === "number" && (
        <span className="text-live mr-1.5 font-medium">{formatNumber(message.amount)}P</span>
      )}
      <span className="mr-1.5 text-white/70">후원</span>
      {message.content && <span className="text-white">{message.content}</span>}
    </p>
  );
}

// 시청 채팅과 같은 마크 컴포넌트를 쓰되, OBS 출력용이라 tooltip은 끈다.
function MessagePrefix({
  role,
  totalMonths,
}: {
  role?: LiveChatOverlayMessage["role"];
  totalMonths?: number | null;
}) {
  if (role !== "creator" && role !== "donor" && role !== "subscriber") {
    return null;
  }

  if (role === "subscriber") {
    return <LiveSubscriptionBadge totalMonths={totalMonths} size="lg" />;
  }

  return <LiveChatRoleBadge role={role} size="lg" />;
}
