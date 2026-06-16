"use client";
// 스티커(이모지) 선택 팝오버(공용). 라이브 채팅 입력바·커뮤니티 작성/댓글에서 재사용.
// 치지직식 아이콘 탭: [최근 사용(시계)] [기본(PixelPlay 마크)] [채널(아바타)].
// 채널 탭은 채널 이모지를 쓸 수 있을 때만(channelStickers 전달 시) 나오고, 로딩/빈 상태도 안내한다.
import { Clock, Smile } from "lucide-react";
import { useMemo, useState } from "react";

import StickerImage from "@/components/sticker/sticker-image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_STICKERS, STICKER_LABEL, STICKER_PX } from "@/constants/sticker/sticker";
import { useRecentStickers } from "@/hooks/sticker/use-recent-stickers";
import type { Sticker } from "@/types/sticker/sticker";
import { buildStickerToken } from "@/utils/sticker/sticker-token";

interface Props {
  onStickerSelect: (token: string) => void;
  disabled?: boolean;
  // 팝오버 열림 방향 — 입력칸이 아래(채팅)면 "top", 위(커뮤니티 작성/댓글)면 "bottom".
  side?: "top" | "bottom";
  // 채널 이모지 사용 가능 시 전달(있으면 채널 탭 노출). 비어 있어도 로딩/빈 상태를 채널 탭에서 안내한다.
  channelStickers?: Sticker[];
  // 채널 이모지 최초 로딩 중 — 채널 탭에 스피너를 띄운다.
  channelLoading?: boolean;
  // 채널 탭 아바타·라벨(아바타 없으면 이름 이니셜 폴백).
  channelName?: string | null;
  channelAvatarUrl?: string | null;
}

// PixelPlay 정사각 브랜드마크(favicon /icon.svg 인라인) — 기본 탭 아이콘. SVG에 라운드(rx)가 내장돼 있다.
function PixelPlayMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden focusable="false">
      <defs>
        <linearGradient id="pp-sticker-mark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="6" fill="#1a1f26" />
      <path d="M10 8V24L24 16L10 8Z" fill="url(#pp-sticker-mark)" />
      <rect x="22" y="22" width="4" height="4" fill="#6ee7b7" />
      <rect x="18" y="22" width="2" height="2" fill="#6ee7b7" opacity="0.6" />
    </svg>
  );
}

// 그리드(5열) — min-height로 탭 전환 시 점프를 막고, 넘치면 숨김 스크롤바로 스크롤한다(우린 채널당 10개).
function StickerGrid({
  stickers,
  disabled,
  onSelect,
  emptyLabel,
}: {
  stickers: Sticker[];
  disabled: boolean;
  onSelect: (id: string) => void;
  emptyLabel: string;
}) {
  if (stickers.length === 0) {
    return (
      <div className="text-muted-foreground flex min-h-40 items-center justify-center px-6 text-center text-xs">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="no-scrollbar max-h-56 min-h-40 overflow-y-auto">
      <div className="grid grid-cols-5 gap-1">
        {stickers.map((sticker) => (
          <button
            key={sticker.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(sticker.id)}
            aria-label={STICKER_LABEL.item(sticker.label)}
            className="hover:bg-muted flex items-center justify-center rounded-lg p-1 transition-colors disabled:opacity-50"
          >
            <StickerImage sticker={sticker} px={STICKER_PX.picker} />
          </button>
        ))}
      </div>
    </div>
  );
}

const TAB_TRIGGER_CLASS = "flex-1 px-0";

export default function StickerPicker({
  onStickerSelect,
  disabled = false,
  side = "top",
  channelStickers,
  channelLoading = false,
  channelName,
  channelAvatarUrl,
}: Props) {
  const [open, setOpen] = useState(false);
  const { recentIds, addRecent } = useRecentStickers();
  const hasChannelTab = channelStickers !== undefined;
  const channel = useMemo(() => channelStickers ?? [], [channelStickers]);

  // 최근 id → Sticker 해석(기본 + 현재 채널). 못 찾는 id(다른 채널·삭제됨)는 자연 제외한다.
  const recentStickers = useMemo(() => {
    const byId = new Map<string, Sticker>();
    for (const sticker of DEFAULT_STICKERS) byId.set(sticker.id, sticker);
    for (const sticker of channel) byId.set(sticker.id, sticker);
    return recentIds
      .map((id) => byId.get(id))
      .filter((sticker): sticker is Sticker => sticker !== undefined);
  }, [recentIds, channel]);
  const hasRecent = recentStickers.length > 0;

  function handleSelect(id: string) {
    if (disabled) return;
    addRecent(id);
    onStickerSelect(buildStickerToken(id));
    // 피커는 닫지 않는다 — 치지직처럼 여러 개를 연속으로 선택할 수 있게 한다.
  }

  // 최근·채널 탭이 모두 없으면(커뮤니티 첫 사용 전 등) 탭 없이 기본 그리드만 보여준다.
  const showTabs = hasRecent || hasChannelTab;

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
            <Smile className="size-5" />
          </Button>
        )}
      />
      <PopoverContent align="start" side={side} sideOffset={8} className="w-84 p-2">
        {showTabs ? (
          <Tabs defaultValue={hasRecent ? "recent" : "default"} className="gap-2">
            <TabsList className="w-full">
              {hasRecent ? (
                <TabsTrigger
                  value="recent"
                  aria-label={STICKER_LABEL.tabRecent}
                  className={TAB_TRIGGER_CLASS}
                >
                  <Clock className="size-5" />
                </TabsTrigger>
              ) : null}
              <TabsTrigger
                value="default"
                aria-label={STICKER_LABEL.tabDefault}
                className={TAB_TRIGGER_CLASS}
              >
                <PixelPlayMark className="size-5" />
              </TabsTrigger>
              {hasChannelTab ? (
                <TabsTrigger
                  value="channel"
                  aria-label={channelName ?? STICKER_LABEL.tabChannel}
                  className={TAB_TRIGGER_CLASS}
                >
                  <Avatar className="size-5">
                    <AvatarImage src={channelAvatarUrl ?? undefined} alt="" />
                    <AvatarFallback className="text-xs">
                      {channelName?.trim().charAt(0) || "채"}
                    </AvatarFallback>
                  </Avatar>
                </TabsTrigger>
              ) : null}
            </TabsList>

            {hasRecent ? (
              <TabsContent value="recent">
                <StickerGrid
                  stickers={recentStickers}
                  disabled={disabled}
                  onSelect={handleSelect}
                  emptyLabel={STICKER_LABEL.emptyRecent}
                />
              </TabsContent>
            ) : null}

            <TabsContent value="default">
              <StickerGrid
                stickers={DEFAULT_STICKERS}
                disabled={disabled}
                onSelect={handleSelect}
                emptyLabel={STICKER_LABEL.emptyRecent}
              />
            </TabsContent>

            {hasChannelTab ? (
              <TabsContent value="channel">
                {channelLoading ? (
                  <div className="text-muted-foreground flex min-h-40 items-center justify-center">
                    <Spinner className="size-5" />
                  </div>
                ) : (
                  <StickerGrid
                    stickers={channel}
                    disabled={disabled}
                    onSelect={handleSelect}
                    emptyLabel={STICKER_LABEL.emptyChannel}
                  />
                )}
              </TabsContent>
            ) : null}
          </Tabs>
        ) : (
          <StickerGrid
            stickers={DEFAULT_STICKERS}
            disabled={disabled}
            onSelect={handleSelect}
            emptyLabel={STICKER_LABEL.emptyRecent}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
