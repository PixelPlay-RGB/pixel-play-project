"use client";
// 라이브 시청 플레이어를 MediaMTX HLS 스트림에 연결합니다.
// #73의 채널 미리보기 플레이어(channel-live-preview-player) 정책을 시청 화면 전용으로 미러링했습니다.
// 그 컴포넌트는 자체 <video>·ref를 소유하고 화질 레벨/외부 ref를 노출하지 않아 직접 재사용할 수 없어,
// 라이브러리(hls.js)와 재생 URL 상수만 공유하고 attach 정책은 여기서 별도로 둡니다.

import Hls from "hls.js";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

const HLS_RETRY_DELAY_MS = 2000;
// 짧은 버퍼 히컵(라이브 지터)엔 대기 화면을 띄우지 않고, 지속 stall일 때만 'waiting'으로 되돌린다.
const STALL_RESET_DELAY_MS = 2500;

// 'waiting' = 방송은 시작됐지만 아직 송출 프레임이 도착하지 않음(OBS 미송출/조인 지연/끊김).
// 'playing' = 첫 프레임이 디코드돼 실제 영상이 보이기 시작함. 컨트롤의 isPlaying(일시정지 여부)과는 다른 신호.
export type LivePlaybackState = "waiting" | "playing";

export interface HlsQualityLevel {
  index: number; // hls.js 레벨 인덱스
  height: number | null; // 세로 해상도(px), 없으면 null
}

interface UseHlsPlayerOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  src: string;
  enabled?: boolean;
}

interface UseHlsPlayerResult {
  // 네이티브 HLS(Safari)는 레벨 API가 없어 levels가 비고, hls.js 경로에서만 채워진다.
  levels: HlsQualityLevel[];
  selectedLevel: number; // -1 = 자동
  setLevel: (index: number) => void;
  // 실제 송출 프레임 도착 여부. 'waiting'이면 송출 대기 오버레이를 띄운다.
  playbackState: LivePlaybackState;
}

export function useHlsPlayer({
  videoRef,
  src,
  enabled = true,
}: UseHlsPlayerOptions): UseHlsPlayerResult {
  const hlsRef = useRef<Hls | null>(null);
  const [levels, setLevels] = useState<HlsQualityLevel[]>([]);
  const [selectedLevel, setSelectedLevel] = useState(-1);
  // SSR=첫 클라 렌더 일치를 위해 결정적으로 'waiting'으로 시작한다(하이드레이션 불일치 방지).
  const [playbackState, setPlaybackState] = useState<LivePlaybackState>("waiting");

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !enabled) return;

    // 네이티브 HLS(Safari/iOS): 레벨 목록 API가 없어 화질 선택은 자동만 제공한다.
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      let retryTimeout: ReturnType<typeof setTimeout> | null = null;

      const retryLoad = () => {
        if (retryTimeout) clearTimeout(retryTimeout);
        retryTimeout = setTimeout(() => video.load(), HLS_RETRY_DELAY_MS);
      };

      video.src = src;
      video.addEventListener("error", retryLoad);
      video.load();

      return () => {
        if (retryTimeout) clearTimeout(retryTimeout);
        video.removeEventListener("error", retryLoad);
        video.removeAttribute("src");
        video.load();
      };
    }

    if (!Hls.isSupported()) return;

    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    const hls = new Hls({
      backBufferLength: 5,
      liveMaxLatencyDuration: 3,
      liveSyncDuration: 1,
      liveSyncMode: "edge",
      lowLatencyMode: true,
      maxBufferLength: 5,
      maxLiveSyncPlaybackRate: 1.2,
    });
    hlsRef.current = hls;

    const retryLoad = () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      retryTimeout = setTimeout(() => hls.startLoad(-1), HLS_RETRY_DELAY_MS);
    };

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      setLevels(hls.levels.map((level, index) => ({ index, height: level.height ?? null })));
    });

    // 자동(-1) 상태에서는 실측 레벨이 바뀌어도 사용자 선택은 자동으로 유지한다.
    hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
      setSelectedLevel((prev) => (prev === -1 ? -1 : data.level));
    });

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        retryLoad();
        return;
      }
      if (data.fatal && data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        hls.recoverMediaError();
      }
    });

    hls.loadSource(src);
    hls.attachMedia(video);

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      hls.destroy();
      hlsRef.current = null;
      setLevels([]);
      setSelectedLevel(-1);
    };
  }, [videoRef, src, enabled]);

  // 송출 프레임 도착 여부를 <video> 이벤트로 파생한다. 서버 online 신호 대신 "픽셀이 실제로 나오는가"를
  // 기준으로 삼아야 검은 화면 번쩍임이 없다. 제거 게이트는 loadeddata(readyState>=HAVE_CURRENT_DATA):
  // autoplay가 막혀 정지 상태여도 정지 프레임을 보여주는 게 검은 대기화면보다 정직하다.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !enabled) return;

    let stallTimer: ReturnType<typeof setTimeout> | null = null;
    const clearStallTimer = () => {
      if (stallTimer) {
        clearTimeout(stallTimer);
        stallTimer = null;
      }
    };

    const markPlaying = () => {
      clearStallTimer();
      setPlaybackState("playing");
    };
    // 짧은 버퍼 히컵엔 대기화면을 띄우지 않고(라이브 지터), 지속 stall일 때만 대기로 되돌린다.
    const scheduleWaiting = () => {
      if (stallTimer) return;
      stallTimer = setTimeout(() => setPlaybackState("waiting"), STALL_RESET_DELAY_MS);
    };
    // 새 로드(또는 detach) 시작 시 즉시 대기로 초기화한다.
    const markWaitingNow = () => {
      clearStallTimer();
      setPlaybackState("waiting");
    };

    video.addEventListener("loadeddata", markPlaying);
    video.addEventListener("playing", markPlaying);
    video.addEventListener("timeupdate", markPlaying);
    video.addEventListener("waiting", scheduleWaiting);
    video.addEventListener("stalled", scheduleWaiting);
    video.addEventListener("loadstart", markWaitingNow);
    video.addEventListener("emptied", markWaitingNow);

    return () => {
      clearStallTimer();
      video.removeEventListener("loadeddata", markPlaying);
      video.removeEventListener("playing", markPlaying);
      video.removeEventListener("timeupdate", markPlaying);
      video.removeEventListener("waiting", scheduleWaiting);
      video.removeEventListener("stalled", scheduleWaiting);
      video.removeEventListener("loadstart", markWaitingNow);
      video.removeEventListener("emptied", markWaitingNow);
    };
  }, [videoRef, enabled]);

  // -1 = 자동. 사용자가 고른 레벨은 즉시 반영하고 hls 인스턴스에도 적용한다.
  const setLevel = useCallback((index: number) => {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.currentLevel = index;
    setSelectedLevel(index);
  }, []);

  return { levels, selectedLevel, setLevel, playbackState };
}
