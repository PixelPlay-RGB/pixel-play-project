"use client";
// 구독자 전용 채널 이모티콘 미리보기 목록을 렌더링합니다.

import StickerImage from "@/components/sticker/sticker-image";
import { cn } from "@/lib/utils";
import type { ChannelEmoji } from "@/types/channel/channel-emoji";
import type { Sticker } from "@/types/sticker/sticker";

interface Props {
  emojis: ChannelEmoji[];
  className?: string;
}

const SUBSCRIPTION_PREVIEW_EMOJI_PX = 32;

function toSticker(emoji: ChannelEmoji): Sticker {
  return { id: emoji.id, label: emoji.name, src: emoji.imageUrl, isAnimated: false };
}

export function SubscriptionChannelEmojiPreview({ emojis, className }: Props) {
  if (emojis.length === 0) {
    return null;
  }

  const stickers = emojis.map(toSticker);

  return (
    <div
      className={cn(
        "bg-muted/30 grid grid-cols-4 gap-3 rounded-lg px-3 py-3 sm:grid-cols-7",
        className,
      )}
    >
      {stickers.map((sticker) => (
        <span
          key={sticker.id}
          title={sticker.label}
          role="img"
          aria-label={sticker.label}
          className="flex size-8 shrink-0 items-center justify-center justify-self-center"
        >
          <StickerImage sticker={sticker} px={SUBSCRIPTION_PREVIEW_EMOJI_PX} />
        </span>
      ))}
    </div>
  );
}
