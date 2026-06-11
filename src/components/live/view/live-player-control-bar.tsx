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
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LivePlayerQualityMenu } from "@/components/live/view/live-player-quality-menu";
import { LivePlayerVolumeControl } from "@/components/live/view/live-player-volume-control";
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
      <span className="ml-1 flex items-center gap-1.5 font-mono text-sm font-bold text-white">
        {/* LIVE는 실시간 여부 표시 겸 복귀 버튼 — 실시간이면 코랄+점멸, 일시정지·지연이면 회색(유튜브식). */}
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                aria-label={
                  isAtLiveEdge ? LIVE_LABEL.playerAtLiveEdge : LIVE_LABEL.playerGoToLiveEdge
                }
                className={cn(
                  "flex cursor-pointer items-center gap-1 transition-colors",
                  isAtLiveEdge ? "text-live" : "text-white/50 hover:text-white/80",
                )}
                onClick={onSeekToLive}
              />
            }
          >
            <Radio className={cn("size-4", isAtLiveEdge && "motion-safe:animate-pulse")} />
            {LIVE_LABEL.live}
          </TooltipTrigger>
          <TooltipContent>
            {isAtLiveEdge ? LIVE_LABEL.playerAtLiveEdge : LIVE_LABEL.playerGoToLiveEdge}
          </TooltipContent>
        </Tooltip>
        {/* 몰입 모드(극장·전체화면)에선 시간·시청자 수가 상단 오버레이로 이동하므로 하단에선 생략하고,
            모바일에선 비디오 아래 정보 행에 같은 값이 있어 좁은 컨트롤 바를 넘치지 않게 숨긴다. */}
        {!isImmersive ? (
          <>
            <span className="hidden sm:inline">· {elapsedText}</span>
            <span className="hidden items-center gap-1 sm:flex">
              ·
              <span className="text-brand flex items-center gap-1">
                <Users className="size-4" />
                {formatCount(viewerCount)}
              </span>
            </span>
          </>
        ) : null}
      </span>

      <div className="ml-auto flex items-center gap-1">
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
