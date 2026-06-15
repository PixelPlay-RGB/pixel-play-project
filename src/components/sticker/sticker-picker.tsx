"use client";
// 스티커(이모지) 선택 팝오버(공용). 라이브 채팅 입력바·커뮤니티 작성/댓글에서 재사용.
// 선택 시 본문에 삽입할 토큰 문자열(:pp-<id>:)을 onStickerSelect로 넘긴다(기존 이모지 피커 대체).
import { Sticker as StickerIcon } from "lucide-react";
import { useState } from "react";

import StickerImage from "@/components/sticker/sticker-image";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DEFAULT_STICKERS, STICKER_LABEL, STICKER_PX } from "@/constants/sticker/sticker";
import { buildStickerToken } from "@/utils/sticker/sticker-token";

interface Props {
  onStickerSelect: (token: string) => void;
  disabled?: boolean;
  // 팝오버 열림 방향 — 입력칸이 아래(채팅)면 "top", 위(커뮤니티 작성/댓글)면 "bottom"으로 본문을 안 가린다.
  side?: "top" | "bottom";
}

export default function StickerPicker({ onStickerSelect, disabled = false, side = "top" }: Props) {
  const [open, setOpen] = useState(false);

  function handleSelect(id: string) {
    if (disabled) return;
    onStickerSelect(buildStickerToken(id));
    // 피커는 닫지 않는다 — 치지직처럼 여러 개를 연속으로 선택할 수 있게 한다.
  }

  return (
    <Popover open={disabled ? false : open} onOpenChange={(next) => !disabled && setOpen(next)}>
      <PopoverTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            size="icon-lg"
            variant="ghost"
            aria-label={STICKER_LABEL.trigger}
            disabled={disabled}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <StickerIcon className="size-5" />
          </Button>
        )}
      />
      <PopoverContent align="start" side={side} sideOffset={8} className="w-auto p-2">
        <div className="grid grid-cols-5 gap-1">
          {DEFAULT_STICKERS.map((sticker) => (
            <button
              key={sticker.id}
              type="button"
              onClick={() => handleSelect(sticker.id)}
              aria-label={STICKER_LABEL.item(sticker.label)}
              className="hover:bg-muted flex items-center justify-center rounded-lg p-1 transition-colors"
            >
              <StickerImage sticker={sticker} px={STICKER_PX.picker} />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
