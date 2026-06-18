"use client";
// 구독자 전용 채널 이모티콘 미리보기 목록을 렌더링합니다.

import StickerImage from "@/components/sticker/sticker-image";
import { STICKER_PX } from "@/constants/sticker/sticker";
import { cn } from "@/lib/utils";
import type { ChannelEmoji } from "@/types/channel/channel-emoji";
import type { Sticker } from "@/types/sticker/sticker";

interface Props {
  emojis: ChannelEmoji[];
  className?: string;
}

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
        "bg-muted/30 flex flex-wrap items-center gap-2 rounded-lg px-3 py-2.5",
        className,
      )}
    >
      {stickers.map((sticker) => (
        <span
          key={sticker.id}
          title={sticker.label}
          className="bg-background/70 flex size-12 shrink-0 items-center justify-center rounded-md"
        >
          <StickerImage sticker={sticker} px={STICKER_PX.overlay} />
        </span>
      ))}
    </div>
  );
}
