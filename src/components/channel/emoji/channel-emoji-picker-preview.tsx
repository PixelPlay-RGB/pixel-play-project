"use client";
// "구독자에게 이렇게 보여요" 미리보기 카드 — 구독자가 채팅에서 보게 될 내 채널 이모지를
// 팝오버 모양 그대로 보여준다(등록·수정·순서변경이 실시간 반영되게 부모 state를 그대로 받는다).
// 그리드의 이모지를 클릭하면 아래 채팅 샘플이 그 이모지로 바뀐다 — 실제 채팅에서의 인라인 크기를 확인.

import { useState } from "react";

import { SettingsCard } from "@/components/common/settings-card";
import StickerImage from "@/components/sticker/sticker-image";
import { CHANNEL_EMOJI_LABEL } from "@/constants/channel/channel-emoji";
import { STICKER_PX } from "@/constants/sticker/sticker";
import { cn } from "@/lib/utils";
import type { ChannelEmoji } from "@/types/channel/channel-emoji";
import type { Sticker } from "@/types/sticker/sticker";

interface Props {
  emojis: ChannelEmoji[];
}

// 채널 이모지를 StickerImage가 받는 Sticker 형태로 변환(렌더 재사용).
function toSticker(emoji: ChannelEmoji): Sticker {
  return { id: emoji.id, label: emoji.name, src: emoji.imageUrl, isAnimated: false };
}

export function ChannelEmojiPickerPreview({ emojis }: Props) {
  const channelStickers = emojis.map(toSticker);
  // 클릭으로 고른 이모지를 샘플에 반영. 삭제 등으로 사라지면 첫 이모지로 자연 폴백(파생값).
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected =
    channelStickers.find((sticker) => sticker.id === selectedId) ?? channelStickers[0];

  return (
    <SettingsCard
      title={CHANNEL_EMOJI_LABEL.previewTitle}
      description={CHANNEL_EMOJI_LABEL.previewDescription}
    >
      {/* 채팅 이모지 버튼을 누르면 뜨는 팝오버 모습(테두리·배경을 실제 PopoverContent와 맞춤). */}
      <div className="bg-popover ring-foreground/10 rounded-xl p-3 ring-1">
        {channelStickers.length > 0 ? (
          // 셀 폭은 이모지 크기 그대로(grid-cols-N의 N등분 stretch 회피) + 이모지 간 간격은 넉넉히.
          <div className="flex flex-wrap gap-2.5">
            {channelStickers.map((sticker) => (
              <button
                key={sticker.id}
                type="button"
                onClick={() => setSelectedId(sticker.id)}
                aria-pressed={selected?.id === sticker.id}
                aria-label={sticker.label}
                className={cn(
                  "flex items-center justify-center rounded-lg p-1 transition-colors",
                  selected?.id === sticker.id
                    ? "bg-brand/10 ring-brand/50 ring-1"
                    : "hover:bg-muted",
                )}
              >
                <StickerImage sticker={sticker} px={STICKER_PX.picker} />
              </button>
            ))}
          </div>
        ) : (
          <div className="border-border/70 text-muted-foreground flex h-20 items-center justify-center rounded-lg border border-dashed text-xs">
            {CHANNEL_EMOJI_LABEL.previewChannelEmpty}
          </div>
        )}
      </div>

      {/* 클릭한 이모지가 실제 채팅에 끼었을 때의 인라인 크기 — 그리드와 달리 본문에선 작게 보인다. */}
      {selected && (
        <div className="border-border bg-muted/40 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm">
          <span className="text-brand shrink-0 font-bold">
            {CHANNEL_EMOJI_LABEL.previewChatNickname}
          </span>
          <span className="text-foreground inline-flex min-w-0 items-center gap-1">
            <span className="truncate">{CHANNEL_EMOJI_LABEL.previewChatText}</span>
            <StickerImage sticker={selected} px={STICKER_PX.inline} />
          </span>
        </div>
      )}
    </SettingsCard>
  );
}
