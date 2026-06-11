"use client";
// OBS 브라우저 소스에 붙이는 라이브 채팅 출력 화면을 렌더링합니다.
import { LiveChatDonationMessageCard } from "@/components/live/chat/live-chat-donation-message-card";
import { LiveChatRoleBadge } from "@/components/live/chat/live-chat-role-badge";
import { useLiveChatOverlay } from "@/hooks/live/use-live-chat-overlay";
import { cn } from "@/lib/utils";
import type {
  LiveChatOverlayMessage,
  LiveChatOverlaySnapshot,
} from "@/types/live/live-chat-overlay";
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
    // OBS 송출 화면 위에서 글자가 묻히지 않도록 배경은 완전 불투명으로 깐다.
    <div className="inline-flex max-w-130 items-start gap-1.5 rounded-xl bg-zinc-950 px-3.5 py-2 drop-shadow">
      <MessagePrefix role={message.role} />
      <p className="min-w-0 text-3xl leading-9 font-semibold wrap-break-word drop-shadow-sm">
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
    <LiveChatDonationMessageCard
      author={message.author}
      amount={message.amount}
      content={message.content}
      variant="overlay"
    />
  );
}

// 시청 채팅과 같은 마크 컴포넌트를 쓰되, OBS 출력용이라 tooltip은 끈다.
function MessagePrefix({ role }: { role?: LiveChatOverlayMessage["role"] }) {
  if (role !== "creator" && role !== "donor") {
    return null;
  }

  return <LiveChatRoleBadge role={role} size="lg" />;
}
