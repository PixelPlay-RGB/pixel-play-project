"use client";
// 라이브 비디오 플레이어 — MediaMTX HLS <video>에 컨테이너 전체화면/극장 모드와 하단 컨트롤 바를 조립합니다.

import { useCallback, useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { HandCoins, MessageSquare, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import LiveBadge from "@/components/live/live-badge";
import { LivePlayerControlBar } from "@/components/live/view/live-player-control-bar";
import { LivePlayerTimeline } from "@/components/live/view/live-player-timeline";
import { LivePlayerTopOverlay } from "@/components/live/view/live-player-top-overlay";
import { LivePlayerWaitingOverlay } from "@/components/live/view/live-player-waiting-overlay";
import {
  LIVE_FULLSCREEN_CHAT_INSET,
  LIVE_LABEL,
  LIVE_PLAYER_ICON_BUTTON_CLASS,
} from "@/constants/live/live";
import { CLIP_DURATION_MAX_SECONDS } from "@/constants/clip/clip";
import { useFullscreen } from "@/hooks/live/use-fullscreen";
import { useHlsPlayer } from "@/hooks/live/use-hls-player";
import { useLivePlayerControls } from "@/hooks/live/use-live-player-controls";
import { cn } from "@/lib/utils";
import type { LiveBroadcast } from "@/types/live/live";

// 전체화면 전용 채팅/후원 오버레이를 컨테이너 내부에 렌더하기 위한 렌더 프롭 컨텍스트.
export interface FullscreenChatContext {
  // 전체화면 요소(모달·popover 포털 대상).
  container: HTMLElement | null;
  isChatOpen: boolean;
  onToggleChat: () => void;
  // 우상단 후원 버튼이 채팅을 열며 후원 popover 열기를 요청한 상태.
  isDonationRequested: boolean;
  // 후원 popover가 닫히면 사유를 받는다. 후원 없이 닫혔으면 채팅도 닫아 전체화면으로 복귀한다.
  onDonationSettled: (reason: "donated" | "dismissed") => void;
}

interface Props {
  broadcast: LiveBroadcast;
  // 크리에이터별 스트림키 path로 서버에서 계산한 재생 URL. 설정 미비 시 null.
  hlsSrc: string | null;
  elapsedText: string;
  isChatCollapsed?: boolean;
  isTheater?: boolean;
  onToggleTheater?: () => void;
  openChatButtonRef?: Ref<HTMLButtonElement>;
  onOpenChat?: () => void;
  // 전체화면일 때 컨테이너 내부에 렌더할 채팅/후원 오버레이. 데이터를 가진 상위(LiveView)가 주입한다.
  renderFullscreenChat?: (ctx: FullscreenChatContext) => ReactNode;
  // 클립 버튼: 로그인 여부(상위 결정) + 비로그인 시 콜백 + 캡처 완료 콜백. 에디터는 별도 창으로
  // 열어 라이브를 보면서 편집하게 한다(팝업은 제스처 동기 시점에 열려야 차단되지 않는다).
  clipLoggedIn?: boolean;
  onClipRequireLogin?: () => void;
  onClipReady?: (payload: {
    popup: Window | null;
    snapshotDataUrl: string | null;
    frames: string[];
  }) => void;
}

// 별도 창 핸드오프(localStorage)로 넘기므로 과대 용량을 막으려 720p로 다운스케일한다.
const CLIP_EDITOR_WINDOW_NAME = "pixelplay-clip-editor";
const CLIP_EDITOR_WINDOW_FEATURES = "popup=yes,width=980,height=920";
const CLIP_EDITOR_LOADING_HTML =
  "<!doctype html><html lang='ko'><head><meta charset='utf-8'><title>클립 만들기</title></head>" +
  "<body style='margin:0;height:100vh;display:flex;align-items:center;justify-content:center;" +
  "background:#0b0b0c;color:#9ca3af;font-family:system-ui,sans-serif;font-size:14px'>" +
  "클립을 준비하고 있어요…</body></html>";

// 현재 프레임 1장(크롭용) — 동기 캡처. 720p 다운스케일로 핸드오프 용량을 줄인다.
function captureCurrentFrame(video: HTMLVideoElement): string | null {
  if (video.videoWidth === 0) return null;
  try {
    const scale = Math.min(1, 720 / video.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  } catch (error) {
    console.error("클립 스냅샷 캡처 실패", error);
    return null;
  }
}

// 한 번의 시킹이 완료될 때까지 기다린다(타임아웃 안전망 — seeked가 안 오면 그냥 진행).
function seekAndWait(video: HTMLVideoElement, time: number, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const finish = () => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      video.removeEventListener("seeked", finish);
      resolve();
    };
    video.addEventListener("seeked", finish, { once: true });
    video.currentTime = time;
    timer = setTimeout(finish, timeoutMs);
  });
}

// 지난 ~30초를 시킹하며 작은 프레임 여러 장을 캡처한다(필름스트립용, best-effort).
// 버퍼 밖이거나 seeked가 늦으면 중복/부족할 수 있어, 호출부에서 폴백을 둔다.
async function captureFilmstrip(video: HTMLVideoElement): Promise<string[]> {
  if (video.videoWidth === 0) return [];
  const seekable = video.seekable;
  if (seekable.length === 0) return [];

  const edge = seekable.end(seekable.length - 1);
  const start = Math.max(seekable.start(0), edge - CLIP_DURATION_MAX_SECONDS);
  const span = edge - start;
  if (span < 1) return [];

  const FRAME_COUNT = 8;
  const wasPaused = video.paused;
  const originalTime = video.currentTime;
  video.pause();

  const scale = Math.min(1, 200 / video.videoHeight);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
  const context = canvas.getContext("2d");
  const frames: string[] = [];

  try {
    if (context) {
      for (let i = 0; i < FRAME_COUNT; i += 1) {
        const target = start + (span * i) / (FRAME_COUNT - 1);
        await seekAndWait(video, target, 350);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL("image/jpeg", 0.5));
      }
    }
  } catch (error) {
    console.error("클립 필름스트립 캡처 실패", error);
  } finally {
    try {
      if (wasPaused) {
        // 과거를 보던 중이었으면 보던 위치를 유지한다.
        video.currentTime = originalTime;
      } else {
        // 라이브 시청 중이었으면 캡처 동안 흘러간 만큼 라이브 엣지로 되돌려 실시간을 유지한다.
        const sk = video.seekable;
        video.currentTime = sk.length > 0 ? sk.end(sk.length - 1) : originalTime;
        void video.play().catch(() => {});
      }
    } catch {
      // 복귀 실패는 무시 — 다음 timeupdate에서 정상화된다.
    }
  }

  return frames;
}

export function LiveVideoPlayer({
  broadcast,
  hlsSrc,
  elapsedText,
  isChatCollapsed = false,
  isTheater = false,
  onToggleTheater,
  openChatButtonRef,
  onOpenChat,
  renderFullscreenChat,
  clipLoggedIn,
  onClipRequireLogin,
  onClipReady,
}: Props) {
  const { containerRef, isFullscreen, toggleFullscreen } = useFullscreen<HTMLDivElement>();
  // 전체화면 채팅 패널 열림 상태. 컨트롤 바 폭(채팅이 가리지 않게)과 공유해야 해 여기서 소유한다.
  const [isFsChatOpen, setIsFsChatOpen] = useState(false);
  // 전체화면 후원 버튼 → 채팅을 열며 입력바의 후원 popover 열기를 요청한다.
  const [isFsDonationRequested, setIsFsDonationRequested] = useState(false);
  // 모달/popover 포털 대상으로 쓰려면 ref가 아닌 실제 노드가 필요해 상태로도 들고 있는다.
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const registerContainer = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      setContainerEl(node);
    },
    [containerRef],
  );

  // 전체화면을 벗어나면 채팅 패널·후원 요청 상태를 닫아 다음 진입 시 깨끗한 상태로 시작한다.
  useEffect(() => {
    if (!isFullscreen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsFsChatOpen(false);
      setIsFsDonationRequested(false);
    }
  }, [isFullscreen]);

  // 채팅을 닫으면 우상단 스택의 토글 버튼으로 포커스를 되돌린다(패널 X에 갇힌 포커스 회수).
  // 여는 방향은 오버레이가 패널 X 버튼으로 포커스를 옮긴다. 초기 마운트엔 가로채지 않는다.
  const fsChatToggleRef = useRef<HTMLButtonElement>(null);
  const prevFsChatOpenRef = useRef(isFsChatOpen);
  useEffect(() => {
    if (prevFsChatOpenRef.current === isFsChatOpen) return;
    prevFsChatOpenRef.current = isFsChatOpen;
    if (!isFsChatOpen) fsChatToggleRef.current?.focus();
  }, [isFsChatOpen]);
  // 극장·전체화면(몰입 모드): 컨트롤 자동 숨김을 빠르게 하고 상단 정보 오버레이를 hover로 띄운다.
  const isImmersive = isFullscreen || isTheater;
  const {
    videoRef,
    isPlaying,
    togglePlay,
    muted,
    volume,
    toggleMute,
    setVolume,
    controlsVisible,
    showControls,
    handlePointerLeave,
    handleFocus,
    handleBlur,
  } = useLivePlayerControls(isImmersive);
  // 유튜브식 플레이어 단축키 — k/스페이스(재생/일시정지)·m(음소거)·f(전체화면)·t(영화관).
  // 입력 요소에 포커스가 있거나 조합키가 눌린 경우는 건드리지 않는다.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true]")) return;
      // 버튼에 포커스가 있을 때 스페이스는 그 버튼의 클릭(기본 동작)이 우선이다.
      if (event.key === " " && target?.closest("button, [role='button']")) return;

      switch (event.key.toLowerCase()) {
        case "k":
        case " ":
          event.preventDefault();
          togglePlay();
          break;
        case "m":
          event.preventDefault();
          toggleMute();
          break;
        case "f":
          event.preventDefault();
          void toggleFullscreen();
          break;
        case "t":
          if (onToggleTheater && !isFullscreen) {
            event.preventDefault();
            onToggleTheater();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, toggleMute, toggleFullscreen, onToggleTheater, isFullscreen]);

  const {
    levels,
    selectedLevel,
    setLevel,
    playbackState,
    isAtLiveEdge,
    seekToLiveEdge,
    timeline,
    seekTo,
  } = useHlsPlayer({
    videoRef,
    src: hlsSrc ?? "",
    enabled: !!hlsSrc,
  });

  const isFullscreenChatOpen = isFullscreen && isFsChatOpen;

  // 클립 버튼: 현재 프레임(크롭용)을 동기로, 지난 ~30초 필름스트립을 best-effort로 캡처해
  // 상위로 올린다. hls.js(MSE)·<video crossOrigin>으로 캔버스 오염은 방지된다 — 필름스트립이
  // 비면 스냅샷 1장으로 폴백한다. 중복 클릭은 ref로 막는다.
  const clipCapturingRef = useRef(false);
  // 캡처 중에는 일시정지(seek)로 인한 중앙 Play 오버레이 깜빡임을 숨긴다.
  const [isCapturingClip, setIsCapturingClip] = useState(false);
  async function handleClipClick() {
    if (clipCapturingRef.current) return;
    if (!clipLoggedIn) {
      onClipRequireLogin?.();
      return;
    }
    const video = videoRef.current;
    if (!video) return;

    // 팝업은 반드시 제스처 동기 시점에 연다(await 뒤면 차단된다). 캡처가 끝나면 상위가 location을 채운다.
    const popup = window.open("", CLIP_EDITOR_WINDOW_NAME, CLIP_EDITOR_WINDOW_FEATURES);
    if (popup) {
      try {
        popup.document.write(CLIP_EDITOR_LOADING_HTML);
        popup.document.close();
      } catch {
        // about:blank 문서 쓰기를 막는 브라우저가 있어도 무시 — 곧 location으로 대체된다.
      }
    }

    clipCapturingRef.current = true;
    setIsCapturingClip(true);
    try {
      const snapshotDataUrl = captureCurrentFrame(video);
      let frames = await captureFilmstrip(video);
      if (frames.length === 0 && snapshotDataUrl) {
        frames = [snapshotDataUrl];
      }

      // 라이브 전체화면 상태면 별도 창이 가려질 수 있어 먼저 빠져나온다.
      if (isFullscreen) {
        void toggleFullscreen();
      }

      onClipReady?.({ popup, snapshotDataUrl, frames });
    } finally {
      clipCapturingRef.current = false;
      setIsCapturingClip(false);
    }
  }

  return (
    <div
      ref={registerContainer}
      onMouseMove={showControls}
      onMouseLeave={handlePointerLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn(
        "relative w-full overflow-hidden bg-black",
        // 일반 모드: 유튜브·치지직처럼 항상 폭 100% + 16:9 — 화면이 낮아 정보 행이 넘치면
        // 좌측 칼럼이 세로 스크롤된다(LiveView). 높이를 캡하면 영상 좌우에 검은 띠가 생긴다.
        isTheater ? "aspect-video md:aspect-auto md:h-full" : "aspect-video",
        // 몰입 모드(극장·전체화면)에서 컨트롤이 숨겨지면 커서도 함께 숨겨 몰입감을 준다.
        isImmersive && !controlsVisible && "cursor-none",
      )}
    >
      {hlsSrc ? (
        // 전체화면 채팅이 열리면 비디오 영역을 패널 폭만큼 좌측으로 줄여, 채팅이 영상을 가리지 않게 한다.
        // 래퍼 div가 left/right 인셋으로 폭을 결정한다(<video>는 replaced element라 left+right만으론
        // width:auto가 본래 크기로 잡혀 줄어들지 않으므로, div로 감싸고 video는 size-full로 채운다).
        <div
          className={cn(
            "absolute top-0 bottom-0 left-0 transition-[right] duration-200",
            isFullscreenChatOpen ? LIVE_FULLSCREEN_CHAT_INSET : "right-0",
          )}
        >
          {/* 유튜브식 영상 영역 조작 — 클릭은 재생/일시정지, 더블클릭은 전체화면.
              더블클릭의 클릭 2번이 재생 상태를 두 번 토글해 원래대로 돌아오므로 타이머 구분이 필요 없다. */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            // 클립 스냅샷용 — Safari 네이티브 HLS에서 canvas.toDataURL이 SecurityError로
            // 죽지 않게 처음부터 부착한다(MediaMTX hlsAllowOrigin 기본 '*' 전제).
            crossOrigin="anonymous"
            className="size-full bg-black object-contain"
            onClick={togglePlay}
            onDoubleClick={() => void toggleFullscreen()}
          />
          {/* 방송은 시작됐지만 송출 프레임이 아직 없으면(OBS 미송출/조인 지연) 비디오를 덮는다.
              <video>는 언마운트하지 않고(언마운트 시 hls 재attach로 영원히 진행 안 됨) 위만 덮는다. */}
          {playbackState !== "playing" ? <LivePlayerWaitingOverlay /> : null}
          {/* 일시정지 상태를 중앙 큰 아이콘으로 보여준다(유튜브식) — 누르면 그 자리에서 재생 재개.
              컨트롤 자동 숨김과 무관하게 떠 있어야 정지 상태가 한눈에 보인다. */}
          {playbackState === "playing" && !isPlaying && !isCapturingClip ? (
            <button
              type="button"
              aria-label={LIVE_LABEL.playerPlay}
              className="absolute inset-0 m-auto flex size-20 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-transform hover:scale-105"
              onClick={togglePlay}
            >
              <Play className="size-9 fill-current" />
            </button>
          ) : null}
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
          <p className="text-sm text-white/70">{LIVE_LABEL.broadcastOffline}</p>
        </div>
      )}

      {/* 상단 정보 오버레이(스트리머 아바타·제목): 극장·전체화면에서 컨트롤과 함께 hover로 나타난다. */}
      {hlsSrc && isImmersive ? (
        <div
          className={cn(
            "absolute top-0 left-0 z-10 bg-linear-to-b from-black/60 to-transparent px-4 pt-4 pb-10 transition-[opacity,right] duration-200",
            controlsVisible ? "opacity-100" : "pointer-events-none opacity-0",
            isFullscreenChatOpen ? LIVE_FULLSCREEN_CHAT_INSET : "right-0",
            // 전체화면에선 우상단 스택(LIVE·채팅·후원)과 제목이 겹치지 않게 오른쪽을 비워 둔다.
            isFullscreen && "pr-20",
          )}
        >
          <LivePlayerTopOverlay
            title={broadcast.title}
            creator={broadcast.creator}
            elapsedText={elapsedText}
            viewerCount={broadcast.viewerCount}
          />
        </div>
      ) : null}

      {hlsSrc ? (
        <div
          className={cn(
            "absolute bottom-0 left-0 z-10 bg-linear-to-t from-black/60 to-transparent px-4 pt-8 pb-4 transition-[opacity,right] duration-200",
            controlsVisible ? "opacity-100" : "pointer-events-none opacity-0",
            // 전체화면 채팅이 열리면 컨트롤 바가 채팅 패널 아래로 깔리지 않게 패널 폭만큼 좁힌다.
            isFullscreenChatOpen ? LIVE_FULLSCREEN_CHAT_INSET : "right-0",
          )}
        >
          {/* 컨트롤 바 위 타임라인 시크바 — 일시정지·과거 이동 후 LIVE 버튼으로 실시간 복귀한다.
              송출 대기 중에는 빈 바만 남아 혼란을 주므로 실제 재생 중에만 보여준다. */}
          {playbackState === "playing" ? (
            <LivePlayerTimeline timeline={timeline} isAtLiveEdge={isAtLiveEdge} onSeek={seekTo} />
          ) : null}
          <LivePlayerControlBar
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            muted={muted}
            volume={volume}
            onToggleMute={toggleMute}
            onVolumeChange={setVolume}
            elapsedText={elapsedText}
            viewerCount={broadcast.viewerCount}
            isImmersive={isImmersive}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            isTheater={isTheater}
            onToggleTheater={onToggleTheater}
            isChatCollapsed={isChatCollapsed}
            openChatButtonRef={openChatButtonRef}
            onOpenChat={onOpenChat}
            qualityLevels={levels}
            selectedQualityLevel={selectedLevel}
            onSelectQualityLevel={setLevel}
            isAtLiveEdge={isAtLiveEdge}
            onSeekToLive={seekToLiveEdge}
            // 송출 프레임이 있어야 잘라낼 구간이 있다 — 대기 화면에선 버튼을 숨긴다.
            onClipClick={
              onClipReady && playbackState === "playing" ? () => void handleClipClick() : undefined
            }
          />
        </div>
      ) : null}

      {/* 전체화면 우상단 스택: LIVE 뱃지 + 채팅 토글 + 후원. 컨트롤과 함께 hover로 나타나고,
          채팅이 열리면 패널 폭만큼 좌측으로 비켜난다. */}
      {hlsSrc && isFullscreen ? (
        <div
          className={cn(
            "absolute top-0 z-10 flex flex-col items-center gap-2 p-4 transition-[opacity,right] duration-200",
            controlsVisible ? "opacity-100" : "pointer-events-none opacity-0",
            isFullscreenChatOpen ? LIVE_FULLSCREEN_CHAT_INSET : "right-0",
          )}
        >
          <LiveBadge />
          {renderFullscreenChat ? (
            <Button
              ref={fsChatToggleRef}
              type="button"
              size="icon"
              variant="ghost"
              aria-label={isFsChatOpen ? LIVE_LABEL.chatCollapse : LIVE_LABEL.chatExpand}
              className={cn(
                LIVE_PLAYER_ICON_BUTTON_CLASS,
                "rounded-full bg-black/45 backdrop-blur-sm",
              )}
              onClick={() => setIsFsChatOpen((prev) => !prev)}
            >
              <MessageSquare className="size-5" />
            </Button>
          ) : null}
          {renderFullscreenChat ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={LIVE_LABEL.donate}
              className={cn(
                LIVE_PLAYER_ICON_BUTTON_CLASS,
                "rounded-full bg-black/45 backdrop-blur-sm",
              )}
              // 후원은 채팅 패널의 입력바 popover로 진행한다 — 패널을 열며 popover 열기를 요청.
              onClick={() => {
                setIsFsChatOpen(true);
                setIsFsDonationRequested(true);
              }}
            >
              <HandCoins className="size-5" />
            </Button>
          ) : null}
        </div>
      ) : null}

      {/* 전체화면 전용 채팅 패널. 전체화면일 때만 컨테이너 안에 렌더한다(토글은 우상단 스택). */}
      {hlsSrc && isFullscreen && renderFullscreenChat
        ? renderFullscreenChat({
            container: containerEl,
            isChatOpen: isFsChatOpen,
            onToggleChat: () => setIsFsChatOpen((prev) => !prev),
            isDonationRequested: isFsDonationRequested,
            onDonationSettled: (reason) => {
              setIsFsDonationRequested(false);
              // 후원 없이 닫았다면 채팅 패널도 닫아 전체화면 영상으로 복귀한다(후원 완료 시엔 채팅 유지).
              if (reason === "dismissed") {
                setIsFsChatOpen(false);
              }
            },
          })
        : null}
    </div>
  );
}
