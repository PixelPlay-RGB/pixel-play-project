"use client";
// 클립 디테일(유튜브 쇼츠 스타일) — 세로 영상 풀하이트 + 위/아래·휠 캐러셀(Motion 세로
// 슬라이드). 영상 우상단에 독립 음량 컨트롤(YT 쇼츠 결), 우측에 액션 레일(공유·엠비언트·
// 전체화면·이전/다음), 하단에 크리에이터(아바타=요약 Popover)·제목·생성일 오버레이.
// 엠비언트(영화관) 모드는 기본 ON — 썸네일을 흑백·고휘도로 흐리게 깐 무채색 백라이트 글로우.

import { useCallback, useEffect, useRef, useState, type ReactNode, type WheelEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, ChevronUp, Maximize2, Minimize2, Share2, Sparkles } from "lucide-react";

import { ClipMiniPlayer, type ClipMiniPlayerHandle } from "@/components/clip/clip-mini-player";
import { ClipVolumeControl } from "@/components/clip/clip-volume-control";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import CreatorAvatarPopover from "@/components/creator/creator-avatar-popover";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { CLIP_LABEL } from "@/constants/clip/clip";
import { useClipShorts, type ClipShortsDirection } from "@/hooks/clip/use-clip-shorts";
import { useFullscreen } from "@/hooks/live/use-fullscreen";
import { cn } from "@/lib/utils";
import type { LiveClip } from "@/types/clip/clip";
import { formatRelativeTime } from "@/utils/common/format";
import { formatCount } from "@/utils/live/live-chat";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";

export interface ClipShortsCreator {
  id: string;
  nickname: string;
  photoUrl: string | null;
  isFollowing: boolean;
  followerCount: number;
  isOwnChannel: boolean;
  // 현재 라이브 여부 — 팝오버에서 "라이브 보기" 링크 노출에 쓴다.
  isLive: boolean;
}

interface Props {
  initialClip: LiveClip;
  creator: ClipShortsCreator | null;
}

// 다음(1)은 아래에서 올라오고, 이전(-1)은 위에서 내려온다 — 쇼츠 스와이프 방향과 동일.
const slideVariants = {
  enter: (direction: ClipShortsDirection) => ({ y: direction > 0 ? "100%" : "-100%" }),
  center: { y: "0%" },
  exit: (direction: ClipShortsDirection) => ({ y: direction > 0 ? "-100%" : "100%" }),
};

// 우측 레일 공용 버튼 스타일 — 크게(size-12), hover는 opacity로 은은하게.
const RAIL_BUTTON_CLASS =
  "flex size-12 cursor-pointer items-center justify-center rounded-full text-white opacity-90 backdrop-blur-sm transition-opacity hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30";
// ON 상태 — brand 채움 + 부드러운 brand 글로우 링(평면 단색보다 또렷하게).
const RAIL_ACTIVE_CLASS =
  "bg-brand text-brand-foreground opacity-100 shadow-lg shadow-brand/40 ring-2 ring-brand/40";

// 레일 버튼 — 툴팁 + 탭 스케일 피드백 + ON 글로우를 공통으로 묶는다.
function RailButton({
  label,
  onClick,
  disabled,
  pressed,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <motion.button
            type="button"
            aria-label={label}
            aria-pressed={pressed}
            disabled={disabled}
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            className={cn(RAIL_BUTTON_CLASS, active ? RAIL_ACTIVE_CLASS : "bg-black/40")}
          >
            {children}
          </motion.button>
        }
      />
      <TooltipContent side="left">{label}</TooltipContent>
    </Tooltip>
  );
}

export function ClipShortsView({ initialClip, creator }: Props) {
  const { currentClip, direction, prevClip, nextClip, goPrev, goNext } = useClipShorts(initialClip);
  const prefersReducedMotion = useReducedMotion();
  // 음소거/음량은 클립 전환 간 유지한다(한 번 소리를 켜면 다음 클립도 켜진 채 재생).
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.8);
  // 엠비언트(영화관) 모드 기본 ON.
  const [isAmbient, setIsAmbient] = useState(true);
  const { containerRef, isFullscreen, toggleFullscreen } = useFullscreen<HTMLDivElement>();
  // 캐러셀 전환 중 이전 플레이어가 언마운트되며 ref를 null로 만들지 않게, handle이 있을 때만
  // 저장하는 콜백 ref를 쓴다(공유 ref면 새 플레이어 mount 뒤 옛 플레이어 unmount가 null로 덮어씀).
  const playerHandleRef = useRef<ClipMiniPlayerHandle | null>(null);
  const setPlayerRef = useCallback((handle: ClipMiniPlayerHandle | null) => {
    if (handle) playerHandleRef.current = handle;
  }, []);

  // 단축키 — ↑/↓: 이전/다음, 스페이스·k: 재생/일시정지, m: 음소거, f: 전체화면.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      // 음량 슬라이더(role=slider) 등 자체 키 처리를 하는 컨트롤에 포커스가 있으면 단축키를 막는다
      // (안 막으면 음량 ↑/↓가 클립 탐색까지 동시에 발동한다).
      if (target?.closest("input, textarea, select, [contenteditable=true], [role='slider']"))
        return;

      switch (event.key.toLowerCase()) {
        case "arrowup":
          event.preventDefault();
          goPrev();
          break;
        case "arrowdown":
          event.preventDefault();
          goNext();
          break;
        case " ":
        case "k":
          // 버튼에 포커스가 있을 때 스페이스는 그 버튼 클릭이 우선.
          if (event.key === " " && target?.closest("button, [role='button']")) return;
          event.preventDefault();
          playerHandleRef.current?.togglePlay();
          break;
        case "m":
          event.preventDefault();
          setMuted((prev) => !prev);
          break;
        case "f":
          event.preventDefault();
          toggleFullscreen();
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goPrev, goNext, toggleFullscreen]);

  // 마우스 휠로도 탐색한다 — 한 번의 스크롤이 한 칸만 넘어가게 스로틀한다.
  const lastWheelRef = useRef(0);
  const handleWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      if (Math.abs(event.deltaY) < 16) return;
      if (event.timeStamp - lastWheelRef.current < 450) return;
      lastWheelRef.current = event.timeStamp;
      if (event.deltaY > 0) {
        goNext();
      } else {
        goPrev();
      }
    },
    [goNext, goPrev],
  );

  async function copyClipLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/clip/${currentClip.id}`);
      toastAppSuccess(APP_MESSAGE_CODE.success.clip.urlCopied);
    } catch (error) {
      console.error("클립 링크 복사 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.common.unknown);
    }
  }

  // 데스크탑 우측 레일과 모바일 오버레이가 같은 버튼 구성을 공유한다. 음량은 클립 최상단에 고정하고
  // (치지직 결), 나머지 액션은 아래로 내려 justify-between으로 위아래로 벌린다.
  function renderActions(className: string) {
    return (
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className={cn("flex flex-col items-center justify-between", className)}
      >
        {/* 상단 고정 — 음량(클립 최상단, 항상 보이는 인디케이터) */}
        <ClipVolumeControl
          muted={muted}
          volume={volume}
          onToggleMute={() => setMuted((prev) => !prev)}
          onVolumeChange={(next) => {
            setVolume(next);
            setMuted(next === 0);
          }}
        />

        {/* 하단 그룹 — 공유·엠비언트·전체화면·이전/다음 */}
        <div className="flex flex-col items-center gap-2.5">
          <RailButton label={CLIP_LABEL.share} onClick={copyClipLink}>
            <Share2 className="size-6" aria-hidden />
          </RailButton>
          <RailButton
            label={CLIP_LABEL.ambient}
            pressed={isAmbient}
            active={isAmbient}
            onClick={() => setIsAmbient((prev) => !prev)}
          >
            <Sparkles className={cn("size-6", isAmbient && "fill-current")} aria-hidden />
          </RailButton>
          <RailButton
            label={isFullscreen ? CLIP_LABEL.exitFullscreen : CLIP_LABEL.fullscreen}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 className="size-6" aria-hidden />
            ) : (
              <Maximize2 className="size-6" aria-hidden />
            )}
          </RailButton>
          <div className="h-1" />
          <RailButton label={CLIP_LABEL.prevClip} disabled={!prevClip} onClick={goPrev}>
            <ChevronUp className="size-6" aria-hidden />
          </RailButton>
          <RailButton label={CLIP_LABEL.nextClip} disabled={!nextClip} onClick={goNext}>
            <ChevronDown className="size-6" aria-hidden />
          </RailButton>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className={cn(
        "relative overflow-hidden transition-colors duration-300",
        // 엠비언트 ON이면 주변을 극장처럼 검게 가라앉힌다.
        isAmbient ? "bg-black" : "bg-background",
        isFullscreen ? "h-screen" : "h-chat-content",
      )}
    >
      {/* 유튜브 엠비언트 모드 — 재생 중인 영상을 크게 흐리게 깔아 화면 밖으로 색이 번지는 라이브
          글로우(앰비언트 라이팅). 정적 썸네일이 아니라 같은 영상이라 색이 실시간으로 따라 움직인다. */}
      {isAmbient && currentClip.videoUrl ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <video
            key={currentClip.id}
            src={currentClip.videoUrl}
            muted
            loop
            playsInline
            autoPlay
            className="absolute inset-0 size-full scale-150 object-cover opacity-40 blur-3xl saturate-150"
          />
        </div>
      ) : null}

      <div
        className={cn(
          "relative mx-auto flex h-full items-center justify-center gap-3",
          isFullscreen ? "max-w-none p-0" : "max-w-5xl px-3 py-4",
        )}
      >
        {/* 세로 스테이지 — 캐러셀 전환이 일어나는 영역. 전체화면에선 radius·여백 없이 상하 꽉 채운다. */}
        <div
          className={cn(
            "relative aspect-[9/16] h-full w-auto max-w-full overflow-hidden bg-black",
            isFullscreen ? "rounded-none" : "rounded-xl shadow-2xl",
          )}
        >
          <AnimatePresence mode="popLayout" custom={direction} initial={false}>
            <motion.div
              key={currentClip.id}
              className="absolute inset-0"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={
                prefersReducedMotion ? { duration: 0 } : { duration: 0.25, ease: "easeOut" }
              }
            >
              <ClipMiniPlayer
                ref={setPlayerRef}
                clip={currentClip}
                muted={muted}
                volume={volume}
                // 다음 클립이 있으면 종료 시 자동 전환, 없으면 무한 반복(미니 플레이어 내부 처리).
                onRequestNext={nextClip ? goNext : undefined}
              />
            </motion.div>
          </AnimatePresence>

          {/* 시네마 딤 — 밝은 영상을 가라앉히고 하단 정보의 가독성을 확보한다 */}
          <div className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-t from-black/70 via-transparent to-black/10" />

          {/* 정보 오버레이 — 크리에이터(아바타=요약 Popover)·제목·조회수·생성일(진행바 위).
              모바일은 우측 레일이 영상 안에 있어 right 여백을 둬 제목이 레일 밑으로 안 들어가게 한다. */}
          <div className="pointer-events-none absolute right-16 bottom-16 left-3 z-10 flex flex-col gap-2 md:right-3">
            {creator ? (
              <div className="pointer-events-auto flex items-center gap-2">
                {/* 아바타 클릭 = 요약 Popover(채널 보기·라이브·팔로우) — 공용 컴포넌트 재사용 */}
                <CreatorAvatarPopover
                  creatorId={creator.id}
                  creatorNickname={creator.nickname}
                  creatorPhotoUrl={creator.photoUrl}
                  isFollowing={creator.isFollowing}
                  isLive={creator.isLive}
                  confirmUnfollow
                  refreshOnToggle
                  avatarSize="default"
                  avatarClassName="ring-1 ring-white/30"
                />
                <span className="truncate text-sm font-bold text-white drop-shadow-sm">
                  {creator.nickname}
                </span>
              </div>
            ) : null}
            <p className="line-clamp-2 text-sm font-semibold text-white drop-shadow-sm">
              {currentClip.title}
            </p>
            <p className="text-xs text-white/75">
              조회수 {formatCount(currentClip.viewCount)}
              {CLIP_LABEL.viewCountSuffix} · {formatRelativeTime(currentClip.createdAt)}
            </p>
          </div>

          {/* 모바일 액션 레일 — 우측 세로 전체 높이(음량은 위, 액션은 아래로 벌어짐) */}
          {renderActions("absolute inset-y-0 right-2 z-20 py-3 md:hidden")}
        </div>

        {/* 데스크탑 우측 레일 */}
        {renderActions("hidden self-stretch py-2 md:flex")}
      </div>

      {/* 인접 클립 메타데이터 프리로드 — 전환 시 시작 지연을 줄인다 */}
      {[prevClip, nextClip].map((clip) =>
        clip?.videoUrl ? (
          <video
            key={clip.id}
            src={clip.videoUrl}
            preload="metadata"
            muted
            playsInline
            className="hidden"
          />
        ) : null,
      )}
    </div>
  );
}
