"use client";
// OBS 브라우저 소스에 붙이는 라이브 채팅 출력 화면을 렌더링합니다.

import { useMemo } from "react";

import { LiveChatRoleBadge } from "@/components/live/chat/live-chat-role-badge";
import { LiveSubscriptionBadge } from "@/components/live/chat/live-subscription-badge";
import RichMessageText from "@/components/common/rich-message-text";
import { LiveChatOverlayDonationCard } from "@/components/live/overlay/live-chat-overlay-donation-card";
import { LIVE_CHAT_OVERLAY_PREVIEW_ITEMS } from "@/constants/live/live-overlay";
import { STICKER_PX } from "@/constants/sticker/sticker";
import { useChannelEmojiStickersByIds } from "@/hooks/channel/use-channel-emoji-stickers";
import { useLiveChatOverlay } from "@/hooks/live/use-live-chat-overlay";
import { cn } from "@/lib/utils";
import type {
  LiveChatOverlayMessage,
  LiveChatOverlaySnapshot,
} from "@/types/live/live-chat-overlay";
import type { Sticker } from "@/types/sticker/sticker";
import { isUuid } from "@/utils/common/uuid";
import { getLiveChatOverlayNicknameColor } from "@/utils/live/live-chat-overlay-style";
import { extractStickerTokenIds } from "@/utils/sticker/sticker-token";

function extractOverlayChannelEmojiTokenIds(
  items: readonly { message: LiveChatOverlayMessage }[],
): string[] {
  const tokenIds = new Set<string>();

  for (const item of items) {
    if (item.message.kind === "donation") continue;
    for (const tokenId of extractStickerTokenIds(item.message.content)) {
      if (isUuid(tokenId)) tokenIds.add(tokenId);
    }
  }

  return [...tokenIds].sort();
}

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
  // 구독 N개월 티콘(LiveSubscriptionBadge) 렌더용 — 스냅샷에서 커스텀 개월·버전을 받는다.
  const subscriptionBadgeCustomMonths = initialSnapshot.subscriptionBadgeCustomMonths;
  const subscriptionBadgeVersion = initialSnapshot.subscriptionBadgeVersion;
  // 미리보기는 방송·채팅 이력이 없어도 화면 구성을 보여줘야 하므로 샘플로 채운다(실데이터가 있으면 그대로).
  const items =
    isPreview && visibleItems.length === 0 ? LIVE_CHAT_OVERLAY_PREVIEW_ITEMS : visibleItems;
  const channelEmojiTokenIds = useMemo(() => extractOverlayChannelEmojiTokenIds(items), [items]);
  const { data: channelStickers } = useChannelEmojiStickersByIds(channelEmojiTokenIds);

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
              creatorId={creatorId}
              message={item.message}
              extraStickers={channelStickers}
              subscriptionBadgeCustomMonths={subscriptionBadgeCustomMonths}
              subscriptionBadgeVersion={subscriptionBadgeVersion}
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
  creatorId,
  message,
  extraStickers,
  subscriptionBadgeCustomMonths,
  subscriptionBadgeVersion,
}: {
  creatorId: string;
  message: LiveChatOverlayMessage;
  extraStickers?: Sticker[];
  subscriptionBadgeCustomMonths: number[];
  subscriptionBadgeVersion: string | null;
}) {
  if (message.kind === "donation") {
    return <DonationMessageItem message={message} />;
  }

  const nicknameColor = getLiveChatOverlayNicknameColor(
    message.author,
    message.roles?.includes("creator") ? "creator" : undefined,
  );
  const messageCreatorId = message.creatorId ?? creatorId;

  return (
    // OBS 송출 화면 위에서 글자가 묻히지 않도록 배경은 완전 불투명으로 깐다.
    // shrink-0: 스택 공간이 부족해도 박스가 세로로 눌리지 않게 한다(후원 카드와 동일 보호).
    <div className="inline-block max-w-130 shrink-0 rounded-xl bg-zinc-950 px-3.5 py-2 drop-shadow">
      {/* 시청 채팅과 같은 정렬 — 뱃지·닉네임·본문·스티커를 한 줄(인라인) align-middle 로 세로 중앙에 맞춘다. */}
      <p className="min-w-0 text-3xl leading-9 font-semibold wrap-break-word drop-shadow-sm">
        <MessagePrefix
          creatorId={messageCreatorId}
          roles={message.roles}
          isSubscriber={message.isSubscriber}
          totalMonths={message.subscriptionTotalMonths}
          subscriptionBadgeCustomMonths={subscriptionBadgeCustomMonths}
          subscriptionBadgeVersion={subscriptionBadgeVersion}
        />
        <span
          className={cn(
            "mr-1.5 align-middle font-medium",
            message.tone === "muted" && "text-white/55",
          )}
          style={message.tone === "muted" ? undefined : { color: nicknameColor }}
        >
          {message.author}
        </span>
        <RichMessageText
          as="span"
          className="align-middle"
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

// 역할 뱃지(creator/manager/donor)는 아이콘으로, 구독자는 N개월 티콘(LiveSubscriptionBadge)으로 — 중복 방지.
// 시청 채팅과 같은 마크 컴포넌트를 쓰되, OBS 출력용이라 tooltip은 끈다.
function MessagePrefix({
  creatorId,
  roles,
  isSubscriber,
  totalMonths,
  subscriptionBadgeCustomMonths,
  subscriptionBadgeVersion,
}: {
  creatorId: string;
  roles?: LiveChatOverlayMessage["roles"];
  isSubscriber?: boolean;
  totalMonths?: number | null;
  subscriptionBadgeCustomMonths: number[];
  subscriptionBadgeVersion: string | null;
}) {
  // 구독자(subscriber)는 역할 아이콘 대신 N개월 티콘으로 표시하므로 역할 뱃지에서 제외한다.
  const roleBadges = (roles ?? []).filter((role) => role !== "subscriber");
  const showSubscriptionBadge = creatorId.length > 0 && Boolean(isSubscriber);
  if (roleBadges.length === 0 && !showSubscriptionBadge) {
    return null;
  }

  return (
    <span className="mr-1.5 inline-flex items-center gap-0.5 align-middle">
      {roleBadges.map((role) => (
        <LiveChatRoleBadge key={role} role={role} size="lg" />
      ))}
      {showSubscriptionBadge ? (
        <LiveSubscriptionBadge
          creatorId={creatorId}
          totalMonths={totalMonths}
          customMonths={subscriptionBadgeCustomMonths}
          version={subscriptionBadgeVersion}
          size="lg"
        />
      ) : null}
    </span>
  );
}
