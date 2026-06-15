"use client";
// 라이브 플레이어 하단 컨트롤 바 — 재생·음량·경과시간·화질·극장·전체화면 컨트롤을 배치합니다.

import type { Ref } from "react";
import {
  Maximize2,
  Minimize2,
  PanelRightOpen,
  Pause,
  Play,
  RectangleHorizontal,
  Scissors,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LivePlayerLiveIndicator } from "@/components/live/view/live-player-live-indicator";
import { LivePlayerQualityMenu } from "@/components/live/view/live-player-quality-menu";
import { LivePlayerVolumeControl } from "@/components/live/view/live-player-volume-control";
import { CLIP_LABEL } from "@/constants/clip/clip";
import { LIVE_LABEL, LIVE_PLAYER_ICON_BUTTON_CLASS } from "@/constants/live/live";
import type { HlsQualityLevel } from "@/hooks/live/use-hls-player";
import { cn } from "@/lib/utils";
import { formatCount } from "@/utils/live/live-chat";

interface Props {
  isPlaying: boolean;
  onTogglePlay: () => void;
  muted: boolean;
  volume: number;
  onToggleMute: () => void;
  onVolumeChange: (value: number) => void;
  elapsedText: string;
  viewerCount: number;
  // 몰입 모드(극장·전체화면)에선 시간·시청자 수를 상단 오버레이로 옮기므로 하단에선 LIVE 표시만 남긴다.
  isImmersive: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isTheater: boolean;
  onToggleTheater?: () => void;
  isChatCollapsed: boolean;
  openChatButtonRef?: Ref<HTMLButtonElement>;
  onOpenChat?: () => void;
  qualityLevels: HlsQualityLevel[];
  selectedQualityLevel: number;
  onSelectQualityLevel: (index: number) => void;
  // 실시간 지점 여부(일시정지·시킹으로 뒤처지면 false)와 실시간 복귀 액션.
  isAtLiveEdge: boolean;
  onSeekToLive: () => void;
  // 클립 생성(#124) — 송출 프레임이 있을 때만 상위에서 핸들러를 내려준다.
  onClipClick?: () => void;
}

export function LivePlayerControlBar({
  isPlaying,
  onTogglePlay,
  muted,
  volume,
  onToggleMute,
  onVolumeChange,
  elapsedText,
  viewerCount,
  isImmersive,
  isFullscreen,
  onToggleFullscreen,
  isTheater,
  onToggleTheater,
  isChatCollapsed,
  openChatButtonRef,
  onOpenChat,
  qualityLevels,
  selectedQualityLevel,
  onSelectQualityLevel,
  isAtLiveEdge,
  onSeekToLive,
  onClipClick,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={isPlaying ? LIVE_LABEL.playerPause : LIVE_LABEL.playerPlay}
              className={LIVE_PLAYER_ICON_BUTTON_CLASS}
              onClick={onTogglePlay}
            />
          }
        >
          {/* 핵심 조작(재생/일시정지)은 유튜브처럼 채운 형태로 — 라인 아이콘보다 영상 위에서 또렷하다. */}
          {isPlaying ? (
            <Pause className="size-6 fill-current" />
          ) : (
            <Play className="size-6 fill-current" />
          )}
        </TooltipTrigger>
        <TooltipContent>
          {isPlaying ? LIVE_LABEL.playerPause : LIVE_LABEL.playerPlay} (k)
        </TooltipContent>
      </Tooltip>

      <LivePlayerVolumeControl
        muted={muted}
        volume={volume}
        onToggleMute={onToggleMute}
        onVolumeChange={onVolumeChange}
      />

      {/* 컨트롤 아이콘(size-6)과 시각적 무게를 맞추기 위해 text-sm·size-4로 통일한다. */}
      <span className="ml-2 flex items-center gap-2 font-mono text-sm font-bold text-white">
        {/* LIVE 표시 겸 실시간 복귀 버튼 — 컨트롤 바·미니플레이어가 공유하는 인디케이터에 위임한다. */}
        <LivePlayerLiveIndicator isAtLiveEdge={isAtLiveEdge} onSeekToLive={onSeekToLive} />
        {/* 몰입 모드(극장·전체화면)에선 시간·시청자 수가 상단 오버레이로 이동하므로 하단에선 생략하고,
            모바일에선 비디오 아래 정보 행에 같은 값이 있어 좁은 컨트롤 바를 넘치지 않게 숨긴다. */}
        {!isImmersive ? (
          <>
            <span className="hidden text-white/40 sm:inline">·</span>
            <span className="hidden text-white/90 sm:inline">{elapsedText}</span>
            <span className="hidden text-white/40 sm:inline">·</span>
            <span className="text-brand hidden items-center gap-1 sm:flex">
              <Users className="size-4" />
              {formatCount(viewerCount)}
            </span>
          </>
        ) : null}
      </span>

      <div className="ml-auto flex items-center gap-1">
        {onClipClick ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={CLIP_LABEL.editorTitle}
                  className={LIVE_PLAYER_ICON_BUTTON_CLASS}
                  onClick={onClipClick}
                />
              }
            >
              <Scissors className="size-6" />
            </TooltipTrigger>
            <TooltipContent>{CLIP_LABEL.editorTitle}</TooltipContent>
          </Tooltip>
        ) : null}

        <LivePlayerQualityMenu
          levels={qualityLevels}
          selectedLevel={selectedQualityLevel}
          onSelectLevel={onSelectQualityLevel}
        />

        {onToggleTheater ? (
          <Tooltip>
            <TooltipTrigger
              render={
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
                />
              }
            >
              <RectangleHorizontal className="size-6" />
            </TooltipTrigger>
            <TooltipContent>
              {isTheater ? LIVE_LABEL.playerTheaterExit : LIVE_LABEL.playerTheater} (t)
            </TooltipContent>
          </Tooltip>
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
              <PanelRightOpen className="size-6" />
            </TooltipTrigger>
            <TooltipContent>{LIVE_LABEL.chatExpand}</TooltipContent>
          </Tooltip>
        ) : null}

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={
                  isFullscreen ? LIVE_LABEL.playerFullscreenExit : LIVE_LABEL.playerFullscreen
                }
                className={LIVE_PLAYER_ICON_BUTTON_CLASS}
                onClick={onToggleFullscreen}
              />
            }
          >
            {isFullscreen ? <Minimize2 className="size-6" /> : <Maximize2 className="size-6" />}
          </TooltipTrigger>
          <TooltipContent>
            {isFullscreen ? LIVE_LABEL.playerFullscreenExit : LIVE_LABEL.playerFullscreen} (f)
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
