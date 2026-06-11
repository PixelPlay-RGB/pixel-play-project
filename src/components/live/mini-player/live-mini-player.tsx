"use client";
// 라이브 미니플레이어 — 시청 페이지 밖에서 우하단에 떠서 시청(영상·시청자 집계)을 이어갑니다.
// 본문 더블클릭·우상단 복귀 버튼=시청 화면 복귀(세션 유지), X=시청 종료(presence 퇴장), 종료 신호=자동 닫기+토스트.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { Pause, Play, SquareArrowOutUpRight, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";

import { LivePlayerLiveIndicator } from "@/components/live/view/live-player-live-indicator";
import { LivePlayerVolumeControl } from "@/components/live/view/live-player-volume-control";
import { LivePlayerWaitingOverlay } from "@/components/live/view/live-player-waiting-overlay";
import { Button } from "@/components/ui/button";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { QUERY_KEYS } from "@/constants/common/query-keys";
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const rootRef = useRef<HTMLDivElement>(null);
  // 드래그(motion/react, sticky-save-bar와 동일 패턴) 이동을 뷰포트 안으로 가두는 제약 컨테이너.
  const dragConstraintsRef = useRef<HTMLDivElement>(null);
  const watchHref = `/live/${session.creatorId}`;
  // 메인 플레이어와 동일한 재생·음량 정책 재사용(음소거 자동재생 시작, 음량 0=음소거 파생).
  // 컨트롤 자동 숨김 상태는 안 쓰고 CSS hover(group)로 처리한다.
  const { videoRef, isPlaying, togglePlay, muted, volume, toggleMute, setVolume } =
    useLivePlayerControls();

  // 닫히면 포커스가 있던 컨트롤이 DOM에서 사라져 포커스가 body로 떨어진다(WCAG 2.4.3) —
  // 포커스가 미니 안에 있을 때만 본문 랜드마크(layout의 main, tabIndex=-1)로 회수한다.
  function recoverFocusBeforeClose() {
    const root = rootRef.current;
    if (!root || !root.contains(document.activeElement)) return;
    const main = document.querySelector("main");
    if (main instanceof HTMLElement) main.focus({ preventScroll: true });
  }

  function handleClose() {
    recoverFocusBeforeClose();
    onClose();
  }

  // 컨트롤(버튼·음량 슬라이더)에서 시작한 포인터는 패널 드래그를 시작시키지 않는다 — 이벤트가
  // motion 드래그 리스너가 달린 루트로 버블되기 전에 차단한다(버튼 클릭·슬라이더 조작 자체는 유지).
  function stopDragFromControls(event: ReactPointerEvent) {
    event.stopPropagation();
  }

  // 메인 플레이어와 동일한 attach 정책 재사용. hlsSrc 미비(null)면 세션은 유지하고 대기 오버레이만 띄운다.
  const { playbackState } = useHlsPlayer({
    videoRef,
    src: session.hlsSrc ?? "",
    enabled: !!session.hlsSrc,
  });

  // 미니 표시 중엔 시청 화면(use-live-view-data)이 언마운트라 여기서 방송 채널을 구독한다(상호 배타 — 중복 구독 없음).
  // verifyOnFirstJoin: 시청→미니 핸드오프 갭(이전 구독 해제~새 구독 사이)에 종료된 방송을 첫 조인에서 잡는다.
  useLiveBroadcastRealtime(session.broadcastId, {
    verifyOnFirstJoin: true,
    onEnded: () => {
      // 시청 화면이 언마운트 상태라 watch 캐시가 '라이브'인 채 남는다 — staleTime 안에 재진입하면
      // 죽은 방송으로 세션이 부활하므로 캐시를 제거해 재조회를 강제한다(userId 미포함 prefix 키라
      // 로그인·익명 캐시 모두 매칭).
      queryClient.removeQueries({ queryKey: QUERY_KEYS.live.watch(session.creatorId) });
      recoverFocusBeforeClose();
      onClose();
      toastAppInfo(APP_MESSAGE_CODE.info.live.broadcastEnded);
    },
  });

  return (
    // 드래그 제약 컨테이너 = 뷰포트 전체(pointer-events-none). motion이 이 박스 안으로 미니를 가둔다.
    <div ref={dragConstraintsRef} className="pointer-events-none fixed inset-0 z-50">
      <motion.div
        ref={rootRef}
        role="complementary"
        aria-label={LIVE_LABEL.miniPlayer}
        drag
        dragConstraints={dragConstraintsRef}
        dragMomentum={false}
        dragElastic={0}
        whileDrag={{ cursor: "grabbing" }}
        className={cn(
          // bottom-24: 우하단 모서리에 뜨는 토스트(sonner)·하단 중앙의 설정 저장 바(StickySaveBar,
          // bottom-6+높이 약 58px)의 출현 영역 위로 올려, 모든 폭에서 겹치지 않게 한다.
          "group pointer-events-auto absolute right-4 bottom-24 w-80 overflow-hidden bg-black shadow-lg",
          "md:w-96",
          "cursor-grab active:cursor-grabbing",
        )}
      >
        {/* video+대기 오버레이는 메인(live-video-player)과 동일 마크업이지만, 그쪽은 전체화면 채팅
            인셋 래퍼와 결합돼 있어 의도적으로 추출하지 않는다(attach 정책은 useHlsPlayer로 공유). */}
        <div className="relative aspect-video">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="size-full bg-black object-contain"
          />
          {playbackState !== "playing" ? <LivePlayerWaitingOverlay /> : null}

          {/* 본문 = 드래그 표면 + 더블클릭 시 시청 화면 복귀(세션 유지 — presence 무중단). 단일 클릭은
            드래그 의도와 충돌하므로 내비하지 않는다. 커서(grab)는 루트에서 상속. 접근성 이름·탭 스톱·
            단일클릭 복귀는 우상단 복귀 버튼이 담당한다. */}
          <div
            aria-hidden
            onDoubleClick={() => router.push(watchHref)}
            className="absolute inset-0"
          />

          {/* hover/포커스 시 상단 그라데이션: 우상단 복귀(시청 화면으로) + 닫기(X = 의도된 퇴장, 시청자 수 -1) */}
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0",
              "flex justify-end gap-0.5 p-1.5 pb-8",
              "bg-linear-to-b from-black/60 to-transparent",
              OVERLAY_VISIBILITY_CLASS,
            )}
          >
            {/* 클릭 수신은 이 컨트롤 그룹 div 한 곳에서만 토글한다 — 버튼마다 부착하면 새 컨트롤 추가 시 누락된다.
              onPointerDown stopPropagation: 이 그룹에서 시작한 포인터는 패널 드래그를 시작시키지 않는다. */}
            <div
              onPointerDown={stopDragFromControls}
              className={cn("flex gap-0.5", CONTROL_INTERACTIVITY_CLASS)}
            >
              <Button
                size="icon"
                variant="ghost"
                nativeButton={false}
                render={<Link href={watchHref} />}
                aria-label={LIVE_LABEL.miniPlayerReturn}
                className={LIVE_PLAYER_ICON_BUTTON_CLASS}
              >
                <SquareArrowOutUpRight className="size-5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={LIVE_LABEL.miniPlayerClose}
                className={LIVE_PLAYER_ICON_BUTTON_CLASS}
                onClick={handleClose}
              >
                <X className="size-5" />
              </Button>
            </div>
          </div>

          {/* hover/포커스 시 하단 그라데이션: 좌하단 재생·음량 컨트롤 + 점멸 LIVE(메인 컨트롤 바와 공유) */}
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0",
              "flex items-center gap-1 p-1.5 pt-8",
              "bg-linear-to-t from-black/70 to-transparent",
              OVERLAY_VISIBILITY_CLASS,
            )}
          >
            {/* 클릭 수신은 이 컨트롤 그룹 div 한 곳에서만 토글한다 — 버튼마다 부착하면 새 컨트롤 추가 시 누락된다.
              onPointerDown stopPropagation: 재생/음량 슬라이더 조작이 패널 드래그로 오인되지 않게 한다. */}
            <div
              onPointerDown={stopDragFromControls}
              className={cn("flex items-center gap-1", CONTROL_INTERACTIVITY_CLASS)}
            >
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={isPlaying ? LIVE_LABEL.playerPause : LIVE_LABEL.playerPlay}
                className={LIVE_PLAYER_ICON_BUTTON_CLASS}
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
              </Button>
              <LivePlayerVolumeControl
                muted={muted}
                volume={volume}
                onToggleMute={toggleMute}
                onVolumeChange={setVolume}
              />
            </div>
            <LivePlayerLiveIndicator className="ml-1" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
