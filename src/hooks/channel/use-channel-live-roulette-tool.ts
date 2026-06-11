"use client";
// 방송 운영 룰렛 도구의 항목 편집과 회전 연출 상태를 관리합니다.

import { useMemo, useRef, useState } from "react";

import {
  DEFAULT_ROULETTE_ITEMS,
  ROULETTE_RECOIL_DEGREE,
  ROULETTE_SPIN_DURATION_SECONDS,
  ROULETTE_SEGMENT_COLORS,
} from "@/constants/channel/live-interaction";
import type { PublishRouletteNotice } from "@/hooks/channel/use-channel-live-roulette-notice";
import {
  getRouletteSegments,
  getRouletteTargetDegree,
  getRouletteTargetRotation,
  getValidRouletteItems,
  pickRouletteSegment,
} from "@/utils/channel/live-interaction";

export function useChannelLiveRouletteTool(publishRouletteNotice: PublishRouletteNotice) {
  const [rouletteItems, setRouletteItems] = useState(DEFAULT_ROULETTE_ITEMS);
  const [isRouletteStarted, setIsRouletteStarted] = useState(false);
  const [rouletteResult, setRouletteResult] = useState<string | null>(null);
  const [rouletteRotation, setRouletteRotation] = useState(0);
  const [rouletteRotationKeyframes, setRouletteRotationKeyframes] = useState<number[]>([0]);
  const [pendingRouletteResult, setPendingRouletteResult] = useState<string | null>(null);
  const pendingRouletteNoticeIdRef = useRef<string | null>(null);
  const [isRouletteSpinning, setIsRouletteSpinning] = useState(false);

  const validRouletteItems = useMemo(() => getValidRouletteItems(rouletteItems), [rouletteItems]);
  const rouletteSegments = useMemo(
    () => getRouletteSegments(validRouletteItems),
    [validRouletteItems],
  );
  const canStartRoulette = validRouletteItems.length >= 2;
  const rouletteSegmentStyle = useMemo(() => {
    if (rouletteSegments.length === 0) {
      return { background: "var(--muted)" };
    }

    const stops = rouletteSegments.map((segment, index) => {
      const color = ROULETTE_SEGMENT_COLORS[index % ROULETTE_SEGMENT_COLORS.length];

      return `${color} ${segment.startPercent}% ${segment.endPercent}%`;
    });

    return { background: `conic-gradient(${stops.join(", ")})` };
  }, [rouletteSegments]);

  const handleAddRouletteItem = () => {
    if (isRouletteSpinning) return;

    setRouletteItems((currentItems) => [...currentItems, { label: "" }]);
    setRouletteResult(null);
  };

  const handleRouletteItemLabelChange = (index: number, value: string) => {
    if (isRouletteSpinning) return;

    setRouletteItems((currentItems) =>
      currentItems.map((item, currentIndex) =>
        currentIndex === index ? { ...item, label: value } : item,
      ),
    );
    setRouletteResult(null);
  };

  const handleRemoveRouletteItem = (index: number) => {
    if (isRouletteSpinning) return;

    setRouletteItems((currentItems) =>
      currentItems.filter((_, currentIndex) => currentIndex !== index),
    );
    setRouletteResult(null);
  };

  const handleStartRoulette = () => {
    if (!canStartRoulette || isRouletteSpinning) return;

    setIsRouletteStarted(true);
    setRouletteResult(null);
  };

  const handleResetRouletteItems = () => {
    if (isRouletteSpinning) return;

    setIsRouletteStarted(false);
    setRouletteResult(null);
    setPendingRouletteResult(null);
  };

  const handleSpinRoulette = () => {
    if (rouletteSegments.length === 0 || isRouletteSpinning) return;

    const winnerSegment = pickRouletteSegment(rouletteSegments);

    if (!winnerSegment) return;

    const targetDegree = getRouletteTargetDegree(winnerSegment);
    const nextRotation = getRouletteTargetRotation(rouletteRotation, targetDegree);
    const recoilRotation = rouletteRotation - ROULETTE_RECOIL_DEGREE;
    const fastRotation = Math.max(rouletteRotation + 900, nextRotation - 780);

    setPendingRouletteResult(winnerSegment.item.label);
    setRouletteRotationKeyframes([rouletteRotation, recoilRotation, fastRotation, nextRotation]);
    setRouletteRotation(nextRotation);
    setRouletteResult(null);
    setIsRouletteSpinning(true);
    const noticeId = crypto.randomUUID();

    pendingRouletteNoticeIdRef.current = noticeId;
    void publishRouletteNotice({
      createdAt: new Date().toISOString(),
      durationSeconds: ROULETTE_SPIN_DURATION_SECONDS,
      id: noticeId,
      items: validRouletteItems.map((item) => item.label),
      resultLabel: "룰렛 진행 중",
      rotationKeyframes: [rouletteRotation, recoilRotation, fastRotation, nextRotation],
      status: "active",
    });
  };

  const handleRouletteAnimationComplete = () => {
    if (!isRouletteSpinning || !pendingRouletteResult) return;

    const nextResult = pendingRouletteResult;

    setRouletteResult(nextResult);
    setPendingRouletteResult(null);
    setIsRouletteSpinning(false);
    const noticeId = pendingRouletteNoticeIdRef.current ?? crypto.randomUUID();

    pendingRouletteNoticeIdRef.current = null;
    void publishRouletteNotice({
      createdAt: new Date().toISOString(),
      id: noticeId,
      items: validRouletteItems.map((item) => item.label),
      resultLabel: nextResult,
      rotationKeyframes: [rouletteRotation],
      status: "ended",
    });
  };

  const resetRouletteState = () => {
    setIsRouletteStarted(false);
    setRouletteResult(null);
    setPendingRouletteResult(null);
    setIsRouletteSpinning(false);
    setRouletteRotationKeyframes([rouletteRotation]);
  };

  // 뒤로가기: 회전 중이거나 결과 확정 전이면 종료 공지를 발행하고, 성공해야 도구를 떠난다.
  const exitTool = async () => {
    if (isRouletteSpinning || pendingRouletteResult) {
      const didPublish = await publishRouletteNotice({
        createdAt: new Date().toISOString(),
        id: pendingRouletteNoticeIdRef.current ?? crypto.randomUUID(),
        items: validRouletteItems.map((item) => item.label),
        resultLabel: "룰렛 종료",
        rotationKeyframes: [rouletteRotation],
        status: "ended",
      });

      if (!didPublish) return false;
    }

    pendingRouletteNoticeIdRef.current = null;
    resetRouletteState();
    return true;
  };

  return {
    canStartRoulette,
    exitTool,
    handleAddRouletteItem,
    handleRemoveRouletteItem,
    handleResetRouletteItems,
    handleRouletteAnimationComplete,
    handleRouletteItemLabelChange,
    handleSpinRoulette,
    handleStartRoulette,
    isRouletteSpinning,
    isRouletteStarted,
    rouletteItems,
    rouletteResult,
    rouletteRotationKeyframes,
    rouletteSegments,
    rouletteSegmentStyle,
    validRouletteItems,
  };
}

export type ChannelLiveRouletteTool = ReturnType<typeof useChannelLiveRouletteTool>;
