"use client";
// 라이브 플레이어의 재생·음량·컨트롤 표시 상태를 관리합니다.
// videoRef는 실제 스트림(<video>) 연결 전까지 seam으로만 둔다.
// TODO(#73 머지 후): togglePlay에서 videoRef.current?.play()/pause()로 실제 재생 제어를 연결한다.

import { useCallback, useEffect, useRef, useState, type FocusEvent } from "react";

const DEFAULT_VOLUME = 1;
const CONTROLS_HIDE_DELAY_MS = 2500;

export function useLivePlayerControls() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusWithinRef = useRef(false);
  // 음소거 해제 시 되돌릴 직전 볼륨. 음소거는 volume===0으로 표현하고 muted는 파생값으로 둔다.
  const previousVolumeRef = useRef(DEFAULT_VOLUME);

  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
  const [controlsVisible, setControlsVisible] = useState(true);

  const muted = volume === 0;

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
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
