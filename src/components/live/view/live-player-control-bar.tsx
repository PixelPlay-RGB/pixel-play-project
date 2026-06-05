"use client";
// 라이브 플레이어 하단 컨트롤 바 — 재생·음량·경과시간·화질·극장·전체화면 컨트롤을 배치합니다.

import type { Ref } from "react";
import {
  Maximize2,
  Minimize2,
  PanelRightOpen,
  Pause,
  Play,
  Radio,
  RectangleHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LivePlayerQualityMenu } from "@/components/live/view/live-player-quality-menu";
import { LivePlayerVolumeControl } from "@/components/live/view/live-player-volume-control";
import { LIVE_LABEL, LIVE_PLAYER_ICON_BUTTON_CLASS } from "@/constants/live/live";
import { cn } from "@/lib/utils";

interface Props {
  isPlaying: boolean;
  onTogglePlay: () => void;
  muted: boolean;
  volume: number;
  onToggleMute: () => void;
  onVolumeChange: (value: number) => void;
  elapsedText: string;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isTheater: boolean;
  onToggleTheater?: () => void;
  isChatCollapsed: boolean;
  openChatButtonRef?: Ref<HTMLButtonElement>;
  onOpenChat?: () => void;
}

export function LivePlayerControlBar({
  isPlaying,
  onTogglePlay,
  muted,
  volume,
  onToggleMute,
  onVolumeChange,
  elapsedText,
  isFullscreen,
  onToggleFullscreen,
  isTheater,
  onToggleTheater,
  isChatCollapsed,
  openChatButtonRef,
  onOpenChat,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label={isPlaying ? LIVE_LABEL.playerPause : LIVE_LABEL.playerPlay}
        className={LIVE_PLAYER_ICON_BUTTON_CLASS}
        onClick={onTogglePlay}
      >
        {isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
      </Button>

      <LivePlayerVolumeControl
        muted={muted}
        volume={volume}
        onToggleMute={onToggleMute}
        onVolumeChange={onVolumeChange}
      />

      <span className="ml-1 flex items-center gap-1 font-mono text-xs font-bold text-white">
        <Radio className="size-3" />
        {LIVE_LABEL.live} · {elapsedText}
      </span>

      <div className="ml-auto flex items-center gap-1">
        <LivePlayerQualityMenu />

        {onToggleTheater ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={isTheater ? LIVE_LABEL.playerTheaterExit : LIVE_LABEL.playerTheater}
            className={cn(
              LIVE_PLAYER_ICON_BUTTON_CLASS,
              "hidden md:inline-flex",
              isTheater && "text-live",
            )}
            onClick={onToggleTheater}
          >
            <RectangleHorizontal className="size-5" />
          </Button>
        ) : null}

        {isChatCollapsed && onOpenChat ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  ref={openChatButtonRef}
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={LIVE_LABEL.chatExpand}
                  className={cn(LIVE_PLAYER_ICON_BUTTON_CLASS, "hidden md:inline-flex")}
                  onClick={onOpenChat}
                />
              }
            >
              <PanelRightOpen className="size-5" />
            </TooltipTrigger>
            <TooltipContent>{LIVE_LABEL.chatExpand}</TooltipContent>
          </Tooltip>
        ) : null}

        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={isFullscreen ? LIVE_LABEL.playerFullscreenExit : LIVE_LABEL.playerFullscreen}
          className={LIVE_PLAYER_ICON_BUTTON_CLASS}
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
        </Button>
      </div>
    </div>
  );
}
