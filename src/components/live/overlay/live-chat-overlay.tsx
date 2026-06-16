"use client";
// OBS 브라우저 소스에 붙이는 라이브 채팅 출력 화면을 렌더링합니다.
import { LiveChatOverlayDonationCard } from "@/components/live/overlay/live-chat-overlay-donation-card";
import { LiveChatRoleBadge } from "@/components/live/chat/live-chat-role-badge";
import RichMessageText from "@/components/common/rich-message-text";
import { LIVE_CHAT_OVERLAY_PREVIEW_ITEMS } from "@/constants/live/live-overlay";
import { STICKER_PX } from "@/constants/sticker/sticker";
import { useChannelEmojiStickers } from "@/hooks/channel/use-channel-emoji-stickers";
import { useLiveChatOverlay } from "@/hooks/live/use-live-chat-overlay";
import { cn } from "@/lib/utils";
import type {
  LiveChatOverlayMessage,
  LiveChatOverlaySnapshot,
} from "@/types/live/live-chat-overlay";
import type { Sticker } from "@/types/sticker/sticker";
import { getLiveChatOverlayNicknameColor } from "@/utils/live/live-chat-overlay-style";

export function LiveChatOverlay({
  creatorId,
  initialSnapshot,
  isPreview = false,
}: {
  creatorId: string;
  initialSnapshot: LiveChatOverlaySnapshot;
  isPreview?: boolean;
}) {
  const { chatStackRef, visibleItems } = useLiveChatOverlay(creatorId, initialSnapshot);
  // 채널 이모지(:pp-<uuid>:)도 이미지로 출력한다 — OBS는 비로그인이라 피커는 없고 렌더만 필요해
  // provider 없이 공개 조회로 가져온다(채널 이모지는 읽기 공개 RLS).
  const { data: channelStickers } = useChannelEmojiStickers(creatorId);
  // 미리보기는 방송·채팅 이력이 없어도 화면 구성을 보여줘야 하므로 샘플로 채운다(실데이터가 있으면 그대로).
  const items =
    isPreview && visibleItems.length === 0 ? LIVE_CHAT_OVERLAY_PREVIEW_ITEMS : visibleItems;

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
            "flex h-full min-h-min flex-col items-start justify-end gap-2 overflow-hidden",
            "live-chat-overlay-stack",
          )}
        >
          {items.map((item) => (
            <ChatMessageItem
              key={item.message.id}
              message={item.message}
              extraStickers={channelStickers}
            />
          ))}
        </div>
      </section>

      {isPreview && (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 flex justify-center px-4">
          <span className="rounded-full bg-black/75 px-4 py-2 text-center text-sm font-medium text-white/85 ring-1 ring-white/10">
            미리보기예요. 실제 방송 채팅이 이 모습으로 표시돼요.
          </span>
        </div>
      )}
    </main>
  );
}

function ChatMessageItem({
  message,
  extraStickers,
}: {
  message: LiveChatOverlayMessage;
  extraStickers?: Sticker[];
}) {
  if (message.kind === "donation") {
    return <DonationMessageItem message={message} />;
  }

  const nicknameColor = getLiveChatOverlayNicknameColor(message.author, message.role);

  return (
    // OBS 송출 화면 위에서 글자가 묻히지 않도록 배경은 완전 불투명으로 깐다.
    // shrink-0: 스택 공간이 부족해도 박스가 세로로 눌리지 않게 한다(후원 카드와 동일 보호).
    <div className="inline-flex max-w-130 shrink-0 items-start gap-1.5 rounded-xl bg-zinc-950 px-3.5 py-2 drop-shadow">
      <MessagePrefix role={message.role} />
      <p className="min-w-0 text-3xl leading-9 font-semibold wrap-break-word drop-shadow-sm">
        <span
          className={cn("mr-1.5 font-medium", message.tone === "muted" && "text-white/55")}
          style={message.tone === "muted" ? undefined : { color: nicknameColor }}
        >
          {message.author}
        </span>
        <RichMessageText
          as="span"
          text={message.content}
          stickerPx={STICKER_PX.overlay}
          extraStickers={extraStickers}
        />
      </p>
    </div>
  );
}

function DonationMessageItem({ message }: { message: LiveChatOverlayMessage }) {
  return (
    <LiveChatOverlayDonationCard
      author={message.author}
      amount={message.amount}
      content={message.content}
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
