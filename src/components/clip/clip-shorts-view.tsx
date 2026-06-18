"use client";
// 클립 디테일(유튜브 쇼츠 스타일) — 세로 영상 풀하이트 + 위/아래·휠 캐러셀(Motion 세로 슬라이드).
// 우측 레일: 맨 위 음량(항상 보이는 인디케이터), 아래로 공유·전체화면·더보기(⋮: 엠비언트·삭제)·이전/다음.
// 하단에 크리에이터(아바타=요약 Popover)·제목·생성일 오버레이. 배경은 항상 어두운 극장(라이트
// 모드 대비) + 엠비언트 ON 시 재생 영상을 저해상도 canvas로 샘플링한 유튜브식 컬러 글로우.

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, ChevronUp, Maximize2, Minimize2, Share2 } from "lucide-react";

import { ClipAmbientGlow } from "@/components/clip/clip-ambient-glow";
import { ClipMiniPlayer, type ClipMiniPlayerHandle } from "@/components/clip/clip-mini-player";
import { ClipMoreMenu } from "@/components/clip/clip-more-menu";
import { ClipRailButton, RAIL_BUTTON_CLASS } from "@/components/clip/clip-rail-button";
import { ClipVolumeControl } from "@/components/clip/clip-volume-control";
import CreatorAvatarPopover from "@/components/creator/creator-avatar-popover";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { CLIP_LABEL } from "@/constants/clip/clip";
import { useClipShorts, type ClipShortsDirection } from "@/hooks/clip/use-clip-shorts";
import { useClipShortsControls } from "@/hooks/clip/use-clip-shorts-controls";
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
  isOwnChannel: boolean;
  // 현재 라이브 여부 — 팝오버에서 "라이브 보기" 링크 노출에 쓴다.
  isLive: boolean;
}

interface Props {
  initialClip: LiveClip;
  creator: ClipShortsCreator | null;
  // 로그인 뷰어 id(없으면 null) — 클립 제작자(clipper) 판별용. 채널 주인은 creator.isOwnChannel로도 알 수 있다.
  viewerId: string | null;
}

// 다음(1)은 아래에서 올라오고, 이전(-1)은 위에서 내려온다 — 쇼츠 스와이프 방향과 동일.
const slideVariants = {
  enter: (direction: ClipShortsDirection) => ({ y: direction > 0 ? "100%" : "-100%" }),
  center: { y: "0%" },
  exit: (direction: ClipShortsDirection) => ({ y: direction > 0 ? "-100%" : "100%" }),
};

export function ClipShortsView({ initialClip, creator, viewerId }: Props) {
  const { currentClip, direction, prevClip, nextClip, goPrev, goNext } = useClipShorts(initialClip);
  const router = useRouter();
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
  // 엠비언트 글로우가 현재 재생 중인 영상을 canvas로 샘플링하도록 핸들에서 video를 꺼내준다.
  const getActiveVideo = useCallback(() => playerHandleRef.current?.getVideo() ?? null, []);

  // playerHandleRef·setMuted는 안정 참조라 빈 deps로 충분하다 — 컨트롤 훅이 effect를 재등록하는
  // 조건이 (goPrev·goNext·toggleFullscreen 변화로) 기존과 동일하게 유지된다.
  const togglePlay = useCallback(() => playerHandleRef.current?.togglePlay(), []);
  const toggleMute = useCallback(() => setMuted((prev) => !prev), []);

  // 단축키(↑/↓·스페이스·k·m·f) + 마우스 휠 탐색.
  const { handleWheel } = useClipShortsControls({
    goPrev,
    goNext,
    togglePlay,
    toggleMute,
    toggleFullscreen,
  });

  async function copyClipLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/clip/${currentClip.id}`);
      toastAppSuccess(APP_MESSAGE_CODE.success.clip.urlCopied);
    } catch (error) {
      console.error("클립 링크 복사 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.common.unknown);
    }
  }

  // 메뉴(⋮)에서 삭제가 끝나면(액션·토스트·목록 무효화는 메뉴가 처리) 삭제한 클립에서 벗어난다 —
  // 인접 클립으로 이동, 둘 다 없으면 채널 클립 탭으로.
  function handleClipDeleted() {
    if (nextClip) {
      goNext();
    } else if (prevClip) {
      goPrev();
    } else {
      router.push(`/channel/${currentClip.creatorId}/clip`);
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
          <ClipRailButton label={CLIP_LABEL.share} onClick={copyClipLink}>
            <Share2 className="size-6" aria-hidden />
          </ClipRailButton>
          <ClipRailButton
            label={isFullscreen ? CLIP_LABEL.exitFullscreen : CLIP_LABEL.fullscreen}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 className="size-6" aria-hidden />
            ) : (
              <Maximize2 className="size-6" aria-hidden />
            )}
          </ClipRailButton>
          {/* 더보기(⋮) — 엠비언트 토글 + 삭제. 동작 아이콘 맨 아래(캐러셀 버튼 바로 위). */}
          <ClipMoreMenu
            clip={currentClip}
            viewerId={viewerId}
            side="left"
            triggerClassName={cn(RAIL_BUTTON_CLASS, "bg-black/40")}
            iconClassName="size-6"
            ambient={{ active: isAmbient, onToggle: () => setIsAmbient((prev) => !prev) }}
            onDeleted={handleClipDeleted}
          />
          <div className="h-1" />
          <ClipRailButton label={CLIP_LABEL.prevClip} disabled={!prevClip} onClick={goPrev}>
            <ChevronUp className="size-6" aria-hidden />
          </ClipRailButton>
          <ClipRailButton label={CLIP_LABEL.nextClip} disabled={!nextClip} onClick={goNext}>
            <ChevronDown className="size-6" aria-hidden />
          </ClipRailButton>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className={cn(
        // 쇼츠 뷰어는 테마와 무관하게 항상 어두운 극장 배경 — 흰 텍스트·컨트롤 대비(라이트 모드)와
        // 시네마 무드를 함께 확보한다. 엠비언트는 이 위에 색 글로우만 더한다.
        "relative overflow-hidden bg-black",
        isFullscreen ? "h-screen" : "h-chat-content",
      )}
    >
      {/* 유튜브 엠비언트 — 재생 중인 영상을 저해상도 canvas로 샘플링해 컨테이너 전체에 크게 흐리게
          깐다(지배색만 번지는 라이브 글로우). 별도 영상 디코드 없이 메인 플레이어 프레임을 그린다. */}
      {isAmbient ? <ClipAmbientGlow getVideo={getActiveVideo} clipId={currentClip.id} /> : null}

      <div
        className={cn(
          "relative mx-auto flex h-full items-center justify-center gap-3",
          isFullscreen ? "max-w-none p-0" : "max-w-5xl px-3 py-4",
        )}
      >
        {/* 세로 스테이지 — 캐러셀 전환이 일어나는 영역. 전체화면에선 radius·여백 없이 상하 꽉 채운다. */}
        <div
          className={cn(
            "group relative aspect-[9/16] h-full w-auto max-w-full overflow-hidden bg-black",
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

          {/* 시네마 딤 — 하단을 영화관처럼 짙게 가라앉혀 정보 가독성·무드를 잡고(강한 bottom 그라데이션),
              상단도 살짝 어둡혀 위아래로 프레이밍한다. */}
          <div className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-1/5 bg-gradient-to-b from-black/45 to-transparent" />

          {/* 정보 오버레이 — 크리에이터(아바타=요약 Popover)·제목·조회수·생성일(진행바 위).
              모바일은 우측 레일이 영상 안에 있어 right 여백을 둬 제목이 레일 밑으로 안 들어가게 한다.
              데스크탑은 hover 시에만 슬라이드·페이드로 나타난다(유튜브 결). 모바일(hover 없음)은 상시 노출. */}
          <div
            className={cn(
              "pointer-events-none absolute right-16 bottom-16 left-3 z-10 flex flex-col gap-2 md:right-3",
              "transition-all duration-300 md:translate-y-1 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100",
            )}
          >
            {creator ? (
              <div className="pointer-events-auto flex items-center gap-2 md:pointer-events-none md:group-hover:pointer-events-auto">
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
