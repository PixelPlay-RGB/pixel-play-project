"use client";
// 스티커(이모지) 선택 팝오버(공용). 라이브 채팅 입력바·커뮤니티 작성/댓글에서 재사용.
// 치지직 이모티콘 피커식 — 상단 가로 스크롤 아이콘 탭 행 + 고정 높이 본문(섹션 헤더 + 그리드).
// 탭: [최근(시계)] [기본(PixelPlay 마크)] [채널(크리에이터 아바타)]. 채널 탭은 채널 이모지를
// 보낼 수 있을 때만(channelStickers 전달) 나온다. 팝오버 높이·구조를 고정해, 탭 전환·선택 시에도
// 팝오버가 재배치(순간이동)되지 않게 한다.
import { Clock, Smile } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import StickerImage from "@/components/sticker/sticker-image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { DEFAULT_STICKERS, STICKER_LABEL, STICKER_PX } from "@/constants/sticker/sticker";
import { useRecentStickers } from "@/hooks/sticker/use-recent-stickers";
import { cn } from "@/lib/utils";
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

type StickerTabKey = "recent" | "default" | "channel";

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

// 상단 아이콘 탭 — 고정 정사각. 가로 스크롤 행 안에서 줄어들지 않게 shrink-0.
function TabButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
        active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60",
      )}
    >
      {children}
    </button>
  );
}

// 본문 그리드(5열) — 부모가 고정 높이를 잡으므로 여긴 내용만 채운다(넘치면 부모가 스크롤).
function StickerGrid({
  stickers,
  disabled,
  onSelect,
}: {
  stickers: Sticker[];
  disabled: boolean;
  onSelect: (id: string) => void;
}) {
  return (
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
  );
}

// 본문 빈/로딩 안내 — 고정 높이 영역을 꽉 채워 중앙 정렬(높이 변동 없음).
function PickerNotice({ children }: { children: ReactNode }) {
  return (
    <div className="text-muted-foreground flex h-full items-center justify-center px-6 text-center text-xs">
      {children}
    </div>
  );
}

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
  const [activeTab, setActiveTab] = useState<StickerTabKey>("default");
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

  function handleOpenChange(next: boolean) {
    if (disabled) return;
    setOpen(next);
    // 열 때마다 최근(있으면)을 첫 탭으로 — 치지직처럼 최근부터 보여준다.
    if (next) setActiveTab(hasRecent ? "recent" : "default");
  }

  function handleSelect(id: string) {
    if (disabled) return;
    addRecent(id);
    onStickerSelect(buildStickerToken(id));
    // 피커는 닫지 않는다 — 여러 개를 연속으로 선택할 수 있게 한다.
  }

  // 현재 탭의 섹션 헤더 텍스트(채널 탭은 채널 이름, 없으면 "내 채널").
  const sectionLabel =
    activeTab === "recent"
      ? STICKER_LABEL.sectionRecent
      : activeTab === "channel"
        ? (channelName ?? STICKER_LABEL.tabChannel)
        : STICKER_LABEL.sectionDefault;

  function renderBody() {
    if (activeTab === "recent") {
      if (!hasRecent) return <PickerNotice>{STICKER_LABEL.emptyRecent}</PickerNotice>;
      return <StickerGrid stickers={recentStickers} disabled={disabled} onSelect={handleSelect} />;
    }
    if (activeTab === "channel") {
      if (channelLoading) {
        return (
          <PickerNotice>
            <Spinner className="size-5" />
          </PickerNotice>
        );
      }
      if (channel.length === 0) return <PickerNotice>{STICKER_LABEL.emptyChannel}</PickerNotice>;
      return <StickerGrid stickers={channel} disabled={disabled} onSelect={handleSelect} />;
    }
    return <StickerGrid stickers={DEFAULT_STICKERS} disabled={disabled} onSelect={handleSelect} />;
  }

  return (
    <Popover open={disabled ? false : open} onOpenChange={handleOpenChange}>
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
      {/* 입력칸(채팅) 위로 채팅을 가리며 뜬다 — 트리거가 입력바 오른쪽 끝이라 align="end"로 안쪽(왼쪽)으로 펼친다. */}
      <PopoverContent align="end" side={side} sideOffset={8} className="w-84 p-2">
        <div className="flex flex-col gap-2">
          {/* 가로 스크롤 아이콘 탭 행 — 채널이 많아져도 스크롤로 수용한다(숨김 스크롤바). */}
          <div className="no-scrollbar flex items-center gap-1 overflow-x-auto">
            <TabButton
              active={activeTab === "recent"}
              label={STICKER_LABEL.tabRecent}
              onClick={() => setActiveTab("recent")}
            >
              <Clock className="size-5" />
            </TabButton>
            <TabButton
              active={activeTab === "default"}
              label={STICKER_LABEL.tabDefault}
              onClick={() => setActiveTab("default")}
            >
              <PixelPlayMark className="size-5" />
            </TabButton>
            {hasChannelTab ? (
              <TabButton
                active={activeTab === "channel"}
                label={channelName ?? STICKER_LABEL.tabChannel}
                onClick={() => setActiveTab("channel")}
              >
                <Avatar className="size-6">
                  <AvatarImage src={channelAvatarUrl ?? undefined} alt="" />
                  <AvatarFallback className="text-xs">
                    {channelName?.trim().charAt(0) ?? ""}
                  </AvatarFallback>
                </Avatar>
              </TabButton>
            ) : null}
          </div>

          {/* 섹션 헤더(현재 탭 이름) */}
          <p className="text-muted-foreground truncate px-1 text-xs font-medium">{sectionLabel}</p>

          {/* 고정 높이 본문 — 내용이 바뀌어도 팝오버 크기가 안 변해 재배치(순간이동)가 없다. */}
          <div className="no-scrollbar h-44 overflow-y-auto">{renderBody()}</div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
