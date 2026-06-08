"use client";
// 라이브 플레이어의 재생·음량·컨트롤 표시 상태를 관리합니다.
// videoRef를 실제 스트림(<video>)에 바인딩해 재생/음량을 제어하고, 재생 상태는 video 이벤트로 동기화합니다.

import { useCallback, useEffect, useRef, useState, type FocusEvent } from "react";

const DEFAULT_VOLUME = 1;
const CONTROLS_HIDE_DELAY_MS = 2500;

export function useLivePlayerControls() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusWithinRef = useRef(false);
  // 음소거 해제 시 되돌릴 직전 볼륨. 음소거는 volume===0으로 표현하고 muted는 파생값으로 둔다.
  const previousVolumeRef = useRef(DEFAULT_VOLUME);

  // 자동재생 정책상 음소거(volume 0)로 시작한다. 소리는 사용자가 직접 켠다.
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);

  const muted = volume === 0;

  // 실제 <video> 재생을 토글한다. isPlaying은 play/pause 이벤트로 보정하므로 여기서 낙관적으로 바꾸지 않는다.
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      // 자동재생/사용자 제스처 정책으로 거부될 수 있으나 상태는 이벤트가 보정한다.
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, []);

  const applyVolume = useCallback((next: number) => {
    setVolumeState(next);

    const video = videoRef.current;
    if (video) {
      video.volume = next;
      video.muted = next === 0;
    }
  }, []);

  const setVolume = useCallback(
    (next: number) => {
      if (next > 0) previousVolumeRef.current = next;
      applyVolume(next);
    },
    [applyVolume],
  );

  const toggleMute = useCallback(() => {
    if (volume > 0) {
      previousVolumeRef.current = volume;
      applyVolume(0);
      return;
    }
    applyVolume(previousVolumeRef.current || DEFAULT_VOLUME);
  }, [volume, applyVolume]);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), CONTROLS_HIDE_DELAY_MS);
  }, [clearHideTimer]);

  // 언마운트 시 대기 중인 숨김 타이머를 정리한다.
  useEffect(() => () => clearHideTimer(), [clearHideTimer]);

  // 자동재생을 위해 mount 시 음소거로 시작한다(소리는 사용자 제스처로 켠다).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.volume = 0;
  }, []);

  // 실제 재생 상태를 video 이벤트로 동기화한다.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const sync = () => setIsPlaying(!video.paused);
    video.addEventListener("play", sync);
    video.addEventListener("pause", sync);
    sync();

    return () => {
      video.removeEventListener("play", sync);
      video.removeEventListener("pause", sync);
    };
  }, []);

  // 마우스 이동: 컨트롤을 보이고 숨김 타이머를 다시 건다.
  const showControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  // 마우스가 벗어나면 숨긴다. 단 포커스가 컨트롤 안에 있으면 유지한다.
  const handlePointerLeave = useCallback(() => {
    if (focusWithinRef.current) return;
    clearHideTimer();
    setControlsVisible(false);
  }, [clearHideTimer]);

  // 키보드 포커스가 컨트롤에 들어오면 보이게 하고 자동 숨김을 멈춘다.
  const handleFocus = useCallback(() => {
    focusWithinRef.current = true;
    clearHideTimer();
    setControlsVisible(true);
  }, [clearHideTimer]);

  // 포커스가 컨트롤 밖으로 나가면 다시 숨김 타이머를 건다.
  const handleBlur = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      if (event.currentTarget.contains(event.relatedTarget)) return;
      focusWithinRef.current = false;
      scheduleHide();
    },
    [scheduleHide],
  );

  return {
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
  };
}
