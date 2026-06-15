"use client";
// 클립 디테일(유튜브 쇼츠 스타일) — 세로 영상 풀하이트 + 위/아래·휠 캐러셀(Motion 세로
// 슬라이드) + 시네마 딤 위 크리에이터/제목/생성일 오버레이 + 큰 우측 액션 레일(라이브·공유·
// 음량·엠비언트·전체화면)을 렌더링합니다. 엠비언트 모드는 썸네일을 흐리게 깐 배경 글로우.

import { useCallback, useEffect, useRef, useState, type WheelEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Share2,
  Sparkles,
  UserRound,
} from "lucide-react";

import { ClipMiniPlayer } from "@/components/clip/clip-mini-player";
import { ClipVolumeControl } from "@/components/clip/clip-volume-control";
import CreatorFollowToggle from "@/components/following/creator-follow-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { CLIP_LABEL } from "@/constants/clip/clip";
import { useToggleChannelFollowing } from "@/hooks/channel/use-toggle-channel-following";
import { useClipShorts, type ClipShortsDirection } from "@/hooks/clip/use-clip-shorts";
import { useFullscreen } from "@/hooks/live/use-fullscreen";
import { cn } from "@/lib/utils";
import type { LiveClip } from "@/types/clip/clip";
import { formatRelativeTime } from "@/utils/common/format";
import { formatCount } from "@/utils/live/live-chat";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";

export interface ClipShortsCreator {
  id: string;
  nickname: string;
  photoUrl: string | null;
  isFollowing: boolean;
  followerCount: number;
  isOwnChannel: boolean;
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

export function ClipShortsView({ initialClip, creator }: Props) {
  const { currentClip, direction, prevClip, nextClip, goPrev, goNext } = useClipShorts(initialClip);
  const prefersReducedMotion = useReducedMotion();
  // 음소거/음량은 클립 전환 간 유지한다(한 번 소리를 켜면 다음 클립도 켜진 채 재생).
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [isAmbient, setIsAmbient] = useState(false);
  const { containerRef, isFullscreen, toggleFullscreen } = useFullscreen<HTMLDivElement>();

  // 같은 채널 캐러셀이라 크리에이터는 고정 — 팔로우 토글을 한 번만 시드한다.
  const following = useToggleChannelFollowing({
    creatorId: creator?.id ?? "",
    initialIsFollowing: creator?.isFollowing ?? false,
    initialFollowerCount: creator?.followerCount ?? 0,
  });

  // 키보드 ↑/↓로도 캐러셀을 탐색한다.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        goNext();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goPrev, goNext]);

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

  // 데스크탑 우측 레일과 모바일 오버레이가 같은 버튼 구성을 공유한다.
  function renderActions(className: string) {
    return (
      <div className={cn("flex flex-col items-center gap-2.5", className)}>
        {creator ? (
          <Link
            href={`/channel/${creator.id}`}
            prefetch={false}
            aria-label={CLIP_LABEL.channelLink}
            className={cn(RAIL_BUTTON_CLASS, "bg-black/40")}
          >
            <UserRound className="size-6" aria-hidden />
          </Link>
        ) : null}
        <button
          type="button"
          aria-label={CLIP_LABEL.share}
          onClick={copyClipLink}
          className={cn(RAIL_BUTTON_CLASS, "bg-black/40")}
        >
          <Share2 className="size-6" aria-hidden />
        </button>
        <ClipVolumeControl
          muted={muted}
          volume={volume}
          onToggleMute={() => setMuted((prev) => !prev)}
          onVolumeChange={(next) => {
            setVolume(next);
            setMuted(next === 0);
          }}
        />
        <button
          type="button"
          aria-label={CLIP_LABEL.ambient}
          aria-pressed={isAmbient}
          onClick={() => setIsAmbient((prev) => !prev)}
          className={cn(RAIL_BUTTON_CLASS, isAmbient ? "bg-brand/80" : "bg-black/40")}
        >
          <Sparkles className="size-6" aria-hidden />
        </button>
        <button
          type="button"
          aria-label={isFullscreen ? CLIP_LABEL.exitFullscreen : CLIP_LABEL.fullscreen}
          onClick={toggleFullscreen}
          className={cn(RAIL_BUTTON_CLASS, "bg-black/40")}
        >
          {isFullscreen ? (
            <Minimize2 className="size-6" aria-hidden />
          ) : (
            <Maximize2 className="size-6" aria-hidden />
          )}
        </button>
        <div className="h-2" />
        <button
          type="button"
          aria-label={CLIP_LABEL.prevClip}
          disabled={!prevClip}
          onClick={goPrev}
          className={cn(RAIL_BUTTON_CLASS, "bg-black/40")}
        >
          <ChevronUp className="size-6" aria-hidden />
        </button>
        <button
          type="button"
          aria-label={CLIP_LABEL.nextClip}
          disabled={!nextClip}
          onClick={goNext}
          className={cn(RAIL_BUTTON_CLASS, "bg-black/40")}
        >
          <ChevronDown className="size-6" aria-hidden />
        </button>
      </div>
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
      {/* 엠비언트(영화관) 모드: 썸네일을 흑백·고휘도로 크게 흐리게 깔아 색감 없는 은은한
          백라이트 글로우만 남긴다(유튜브 엠비언트의 무채색 버전 — 무지개 색 번짐 제거). */}
      {isAmbient && currentClip.thumbnailUrl ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <Image
            src={currentClip.thumbnailUrl}
            alt=""
            fill
            sizes="100vw"
            className="scale-125 object-cover opacity-25 blur-3xl brightness-125 grayscale"
          />
        </div>
      ) : null}

      <div className="relative mx-auto flex h-full max-w-5xl items-center justify-center gap-3 px-3 py-4">
        {/* 세로 스테이지 — 캐러셀 전환이 일어나는 영역 */}
        <div className="relative aspect-[9/16] h-full w-auto max-w-full overflow-hidden rounded-xl bg-black shadow-2xl">
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
              <ClipMiniPlayer clip={currentClip} muted={muted} volume={volume} />
            </motion.div>
          </AnimatePresence>

          {/* 시네마 딤 — 밝은 영상을 가라앉히고 하단 정보의 가독성을 확보한다 */}
          <div className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-t from-black/70 via-transparent to-black/10" />

          {/* 정보 오버레이 — 크리에이터·팔로우·제목·조회수·생성일(진행바 위) */}
          <div className="pointer-events-none absolute inset-x-3 bottom-16 z-10 flex flex-col gap-2">
            {creator ? (
              <div className="pointer-events-auto flex items-center gap-2">
                {/* 치지직처럼 — 크리에이터를 누르면 새 탭으로 라이브 시청 페이지를 연다
                    (지금 보던 클립은 그대로 두고 방송으로 바로 이동). */}
                <Link
                  href={`/live/${creator.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-80"
                  aria-label={`${creator.nickname} ${CLIP_LABEL.liveLink}`}
                >
                  <Avatar className="size-8 ring-1 ring-white/30">
                    <AvatarImage
                      src={getAvatarImageSrc(creator.photoUrl)}
                      alt={`${creator.nickname} 프로필`}
                    />
                    <AvatarFallback>{getAvatarFallbackText(creator.nickname)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm font-bold text-white drop-shadow-sm">
                    {creator.nickname}
                  </span>
                </Link>
                {!creator.isOwnChannel ? (
                  <CreatorFollowToggle
                    creatorNickname={creator.nickname}
                    isFollowing={following.isFollowing}
                    isOwnChannel={creator.isOwnChannel}
                    isPending={following.isPending}
                    onToggle={following.toggle}
                  />
                ) : null}
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

          {/* 모바일 액션 레일 — 우측 세로 가운데(쇼츠 결) */}
          {renderActions("absolute top-1/2 right-2 z-20 -translate-y-1/2 md:hidden")}
        </div>

        {/* 데스크탑 우측 레일 */}
        {renderActions("hidden self-center md:flex")}
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
