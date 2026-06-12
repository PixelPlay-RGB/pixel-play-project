"use client";
// 클립 디테일(유튜브 쇼츠 스타일) — 세로 영상 풀하이트 + 위/아래 캐러셀(Motion 세로
// 슬라이드) + 우측 액션 레일(공유·정보·탐색) + 정보 패널 토글을 렌더링합니다.

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, ChevronUp, Info, Share2 } from "lucide-react";

import { ClipInfoPanel, type ClipShortsCreator } from "@/components/clip/clip-info-panel";
import { ClipMiniPlayer } from "@/components/clip/clip-mini-player";
import { Button } from "@/components/ui/button";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { CLIP_LABEL } from "@/constants/clip/clip";
import { useClipShorts, type ClipShortsDirection } from "@/hooks/clip/use-clip-shorts";
import { cn } from "@/lib/utils";
import type { LiveClip } from "@/types/clip/clip";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";

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

export function ClipShortsView({ initialClip, creator }: Props) {
  const { currentClip, direction, prevClip, nextClip, goPrev, goNext } = useClipShorts(initialClip);
  const prefersReducedMotion = useReducedMotion();
  // 음소거/음량은 클립 전환 간 유지한다(한 번 소리를 켜면 다음 클립도 켜진 채 재생).
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

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
      <div className={cn("flex flex-col items-center gap-2", className)}>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="cursor-pointer rounded-full"
          aria-label={CLIP_LABEL.share}
          onClick={copyClipLink}
        >
          <Share2 aria-hidden />
        </Button>
        <Button
          type="button"
          variant={isInfoOpen ? "default" : "secondary"}
          size="icon"
          className="cursor-pointer rounded-full"
          aria-label={CLIP_LABEL.infoToggle}
          aria-pressed={isInfoOpen}
          onClick={() => setIsInfoOpen((prev) => !prev)}
        >
          <Info aria-hidden />
        </Button>
        <div className="h-4" />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="cursor-pointer rounded-full"
          aria-label={CLIP_LABEL.prevClip}
          disabled={!prevClip}
          onClick={goPrev}
        >
          <ChevronUp aria-hidden />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="cursor-pointer rounded-full"
          aria-label={CLIP_LABEL.nextClip}
          disabled={!nextClip}
          onClick={goNext}
        >
          <ChevronDown aria-hidden />
        </Button>
      </div>
    );
  }

  return (
    <div className="h-chat-content bg-background overflow-hidden">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-center gap-4 px-3 py-4">
        {/* 세로 스테이지 — 캐러셀 전환이 일어나는 영역 */}
        <div className="relative aspect-[9/16] h-full w-auto max-w-full overflow-hidden rounded-xl bg-black">
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
                clip={currentClip}
                muted={muted}
                volume={volume}
                onMutedChange={setMuted}
                onVolumeChange={setVolume}
              />
            </motion.div>
          </AnimatePresence>

          {/* 제목·채널 오버레이(컨트롤 바 위) */}
          <div className="pointer-events-none absolute inset-x-3 bottom-24 z-10">
            <p className="line-clamp-2 text-sm font-semibold text-white drop-shadow-sm">
              {currentClip.title}
            </p>
            {creator && <p className="mt-0.5 text-xs text-white/80">{creator.nickname}</p>}
          </div>

          {/* 모바일 정보 패널 — 스테이지 위 오버레이 */}
          {isInfoOpen && (
            <ClipInfoPanel
              clip={currentClip}
              creator={creator}
              className="absolute inset-x-2 bottom-2 z-20 md:hidden"
            />
          )}

          {/* 모바일 액션 오버레이 */}
          {renderActions("absolute right-2 bottom-28 z-10 md:hidden")}
        </div>

        {/* 데스크탑 우측 레일 */}
        {renderActions("hidden self-end pb-2 md:flex")}

        {/* 데스크탑 정보 패널 */}
        {isInfoOpen && (
          <ClipInfoPanel clip={currentClip} creator={creator} className="hidden w-72 md:flex" />
        )}
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
