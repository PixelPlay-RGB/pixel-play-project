"use client";
// 구독자 전용 채널 이모티콘 미리보기 목록을 렌더링합니다.

import StickerImage from "@/components/sticker/sticker-image";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    <div className={cn("border-border bg-muted/20 overflow-hidden rounded-lg border", className)}>
      <ScrollArea className="max-h-36" viewportClassName="overscroll-contain">
        <div className="flex flex-wrap gap-2 p-3 pr-4">
          {stickers.map((sticker) => (
            <div
              key={sticker.id}
              title={sticker.label}
              className="border-border/70 bg-background/80 flex size-16 shrink-0 items-center justify-center rounded-md border"
            >
              <StickerImage sticker={sticker} px={STICKER_PX.picker} />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
