"use client";
// 라이브 미니플레이어 — 시청 페이지 밖에서 우하단에 떠서 시청(영상·시청자 집계)을 이어갑니다.
// 본문 클릭·우상단 복귀 버튼=시청 화면 복귀(세션 유지), X=시청 종료(presence 퇴장), 종료 신호=자동 닫기+토스트.

import Link from "next/link";
import { useRef } from "react";
import { Pause, Play, Radio, SquareArrowOutUpRight, X } from "lucide-react";

import { LivePlayerVolumeControl } from "@/components/live/view/live-player-volume-control";
import { LivePlayerWaitingOverlay } from "@/components/live/view/live-player-waiting-overlay";
import { Button } from "@/components/ui/button";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { LIVE_LABEL, LIVE_PLAYER_ICON_BUTTON_CLASS } from "@/constants/live/live";
import { useHlsPlayer } from "@/hooks/live/use-hls-player";
import { useLiveBroadcastRealtime } from "@/hooks/live/use-live-broadcast-realtime";
import { useLivePlayerControls } from "@/hooks/live/use-live-player-controls";
import { cn } from "@/lib/utils";
import type { LiveWatchSession } from "@/stores/live-watch-session";
import { toastAppInfo } from "@/utils/common/toast-message";

interface Props {
  session: LiveWatchSession;
  onClose: () => void;
}

// 그라데이션 오버레이는 hover/포커스 시에만 보인다. hover가 없는 터치 기기는
// 숨길 방법(재표시 제스처)이 없으므로 항상 보여준다.
const OVERLAY_VISIBILITY_CLASS =
  "opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100";
// 오버레이 컨테이너(그라데이션 포함)는 항상 클릭을 통과시키고, 실제 컨트롤만 보일 때 클릭을 받는다.
// 컨테이너가 받으면 그라데이션 영역이 본문 복귀 클릭을 가로채고, 숨김 상태의 투명 버튼도 오탭된다.
const CONTROL_INTERACTIVITY_CLASS =
  "pointer-events-none group-focus-within:pointer-events-auto group-hover:pointer-events-auto pointer-coarse:pointer-events-auto";

export function LiveMiniPlayer({ session, onClose }: Props) {
  // 종료 이벤트가 언마운트 전에 중복 도착해도 토스트가 한 번만 뜨게 가드한다(use-live-view-data의 didEnd와 동일 정책).
  const endedRef = useRef(false);
  // 메인 플레이어와 동일한 재생·음량 정책 재사용(음소거 자동재생 시작, 음량 0=음소거 파생).
  // 컨트롤 자동 숨김 상태는 안 쓰고 CSS hover(group)로 처리한다.
  const { videoRef, isPlaying, togglePlay, muted, volume, toggleMute, setVolume } =
    useLivePlayerControls();

  // 메인 플레이어와 동일한 attach 정책 재사용. hlsSrc 미비(null)면 세션은 유지하고 대기 오버레이만 띄운다.
  const { playbackState } = useHlsPlayer({
    videoRef,
    src: session.hlsSrc ?? "",
    enabled: !!session.hlsSrc,
  });

  // 미니 표시 중엔 시청 화면(use-live-view-data)이 언마운트라 여기서 방송 채널을 구독한다(상호 배타 — 중복 구독 없음).
  useLiveBroadcastRealtime(session.broadcastId, {
    onEnded: () => {
      if (endedRef.current) return;
      endedRef.current = true;
      onClose();
      toastAppInfo(APP_MESSAGE_CODE.info.live.broadcastEnded);
    },
  });

  return (
    <div
      className={cn(
        "group fixed right-4 bottom-4 z-50 w-80 overflow-hidden bg-black shadow-lg",
        // 데스크탑 토스트(sonner)가 우하단 모서리에 떠서, 출현 영역 위로 올려 겹치지 않게 한다.
        "md:bottom-24 md:w-96",
      )}
    >
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="size-full bg-black object-contain"
        />
        {playbackState !== "playing" ? <LivePlayerWaitingOverlay /> : null}

        {/* 본문 클릭 = 시청 화면 복귀(세션 유지 — presence 무중단). 접근성 이름·탭 스톱은 우상단 복귀 버튼이 담당한다. */}
        <Link
          href={`/live/${session.creatorId}`}
          aria-hidden
          tabIndex={-1}
          className="absolute inset-0"
        />

        {/* hover/포커스 시 상단 그라데이션: 우상단 복귀(시청 화면으로) + 닫기(X = 의도된 퇴장, 시청자 수 -1) */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 flex justify-end gap-0.5 bg-linear-to-b from-black/60 to-transparent p-1.5 pb-8",
            OVERLAY_VISIBILITY_CLASS,
          )}
        >
          <Button
            size="icon"
            variant="ghost"
            nativeButton={false}
            render={<Link href={`/live/${session.creatorId}`} />}
            aria-label={LIVE_LABEL.miniPlayerReturn}
            className={cn(LIVE_PLAYER_ICON_BUTTON_CLASS, CONTROL_INTERACTIVITY_CLASS)}
          >
            <SquareArrowOutUpRight className="size-5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={LIVE_LABEL.miniPlayerClose}
            className={cn(LIVE_PLAYER_ICON_BUTTON_CLASS, CONTROL_INTERACTIVITY_CLASS)}
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* hover/포커스 시 하단 그라데이션: 좌하단 재생·음량 컨트롤 + 점멸 LIVE(메인 컨트롤 바와 동일 스타일) */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-1 bg-linear-to-t from-black/70 to-transparent p-1.5 pt-8",
            OVERLAY_VISIBILITY_CLASS,
          )}
        >
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={isPlaying ? LIVE_LABEL.playerPause : LIVE_LABEL.playerPlay}
            className={cn(LIVE_PLAYER_ICON_BUTTON_CLASS, CONTROL_INTERACTIVITY_CLASS)}
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
          </Button>
          <div className={CONTROL_INTERACTIVITY_CLASS}>
            <LivePlayerVolumeControl
              muted={muted}
              volume={volume}
              onToggleMute={toggleMute}
              onVolumeChange={setVolume}
            />
          </div>
          <span className="text-live ml-1 flex items-center gap-1 font-mono text-xs font-bold">
            <Radio className="size-3 motion-safe:animate-pulse" />
            {LIVE_LABEL.live}
          </span>
        </div>
      </div>
    </div>
  );
}
