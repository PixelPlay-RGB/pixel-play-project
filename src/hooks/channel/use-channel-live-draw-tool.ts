"use client";
// 방송 운영 추첨 도구의 모집·타이머·릴 연출 상태를 관리합니다.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getChannelLiveDrawParticipantsAction } from "@/actions/channel/live";
import {
  DRAW_REEL_DURATION_MS,
  DRAW_REEL_REPEAT_COUNT,
  DRAW_TIMER_MAX_SECONDS,
} from "@/constants/channel/live-interaction";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type { PublishInteractionNotice } from "@/hooks/channel/use-channel-live-interaction-notice";
import type { DrawState } from "@/types/channel/live-interaction";
import { filterChannelLiveDrawParticipants } from "@/utils/channel/channel-live-draw";
import { pickRandomItem, toDrawParticipantNames } from "@/utils/channel/live-interaction";
import { toastAppError } from "@/utils/common/toast-message";

export function useChannelLiveDrawTool(
  broadcastId: string | null,
  publishInteractionNotice: PublishInteractionNotice,
) {
  const [drawSession, setDrawSession] = useState<DrawState | null>(null);
  const [isDrawFollowerOnly, setIsDrawFollowerOnly] = useState(false);
  const [isDrawExcludePreviousWinners, setIsDrawExcludePreviousWinners] = useState(true);
  const [isDrawTimerEnabled, setIsDrawTimerEnabled] = useState(false);
  const [drawTimerSeconds, setDrawTimerSeconds] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawRecruitmentPending, setIsDrawRecruitmentPending] = useState(false);
  const [isDrawParticipantLoading, setIsDrawParticipantLoading] = useState(false);
  const [drawRollingName, setDrawRollingName] = useState<string | null>(null);
  const [drawReelNames, setDrawReelNames] = useState<string[]>([]);
  const [drawReelTargetIndex, setDrawReelTargetIndex] = useState(0);
  const drawSpinStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drawTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drawTimerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const normalizedDrawTimerSeconds = Math.min(
    Math.max(Math.floor(drawTimerSeconds), 0),
    DRAW_TIMER_MAX_SECONDS,
  );
  const filteredDrawParticipants = useMemo(
    () =>
      drawSession
        ? filterChannelLiveDrawParticipants(drawSession.participants, drawSession.winnerUserIds, {
            excludePreviousWinners: isDrawExcludePreviousWinners,
            followerOnly: isDrawFollowerOnly,
          })
        : [],
    [drawSession, isDrawExcludePreviousWinners, isDrawFollowerOnly],
  );
  const drawParticipants = toDrawParticipantNames(filteredDrawParticipants);
  const activeDrawNoticeId = drawSession && !drawSession.endedAt ? drawSession.noticeId : null;
  const activeDrawStartedAt = drawSession && !drawSession.endedAt ? drawSession.startedAt : null;
  const drawParticipantNameById = new Map(
    (drawSession?.participants ?? []).map((participant) => [
      participant.userId,
      participant.nickname,
    ]),
  );
  const drawWinnerNames =
    drawSession?.winnerUserIds.map(
      (winnerUserId) => drawParticipantNameById.get(winnerUserId) ?? "시청자",
    ) ?? [];
  const isDrawRecruiting = Boolean(drawSession && !drawSession.endedAt);
  const canPickDrawWinner =
    Boolean(drawSession?.endedAt) && drawParticipants.length > 0 && !isDrawing;

  useEffect(() => {
    return () => {
      if (drawSpinStartTimeoutRef.current) {
        clearTimeout(drawSpinStartTimeoutRef.current);
      }

      if (drawTimeoutRef.current) {
        clearTimeout(drawTimeoutRef.current);
      }

      if (drawTimerTimeoutRef.current) {
        clearTimeout(drawTimerTimeoutRef.current);
      }
    };
  }, []);

  const handleDrawTimerSecondsChange = (value: string) => {
    const nextValue = Number(value);

    if (!Number.isFinite(nextValue)) {
      setDrawTimerSeconds(0);
      return;
    }

    setDrawTimerSeconds(Math.min(Math.max(Math.floor(nextValue), 0), DRAW_TIMER_MAX_SECONDS));
  };

  const clearDrawTimer = useCallback(() => {
    if (!drawTimerTimeoutRef.current) return;

    clearTimeout(drawTimerTimeoutRef.current);
    drawTimerTimeoutRef.current = null;
  }, []);

  const clearDrawSpinTimers = useCallback(() => {
    if (drawSpinStartTimeoutRef.current) {
      clearTimeout(drawSpinStartTimeoutRef.current);
      drawSpinStartTimeoutRef.current = null;
    }

    if (drawTimeoutRef.current) {
      clearTimeout(drawTimeoutRef.current);
      drawTimeoutRef.current = null;
    }
  }, []);

  const resetDrawState = useCallback(() => {
    clearDrawTimer();
    clearDrawSpinTimers();
    setDrawSession(null);
    setDrawRollingName(null);
    setDrawReelNames([]);
    setDrawReelTargetIndex(0);
    setIsDrawing(false);
    setIsDrawRecruitmentPending(false);
    setIsDrawParticipantLoading(false);
  }, [clearDrawSpinTimers, clearDrawTimer]);

  const handleStartDraw = async () => {
    if (isDrawRecruitmentPending) return;

    const startedAt = new Date().toISOString();

    clearDrawTimer();
    clearDrawSpinTimers();
    setIsDrawRecruitmentPending(true);
    setDrawSession({
      endedAt: null,
      noticeId: null,
      participants: [],
      startedAt,
      winnerUserIds: [],
    });
    setDrawRollingName(null);
    setDrawReelNames([]);
    setDrawReelTargetIndex(0);
    try {
      const noticeId = await publishInteractionNotice({
        content: "추첨 모집이 시작되었습니다.",
        interactionType: "draw",
        metadata: {
          resultLabel: "추첨 모집 중",
          status: "active",
        },
      });

      if (!noticeId) {
        setDrawSession(null);
        return;
      }

      setDrawSession((currentSession) =>
        currentSession?.startedAt === startedAt ? { ...currentSession, noticeId } : currentSession,
      );
    } finally {
      setIsDrawRecruitmentPending(false);
    }
  };

  const loadDrawParticipants = useCallback(
    async (targetSession: DrawState, endedAt: string, options?: { showLoading?: boolean }) => {
      if (!broadcastId) {
        toastAppError(APP_MESSAGE_CODE.error.common.unknown);
        return null;
      }

      if (!targetSession.noticeId) {
        toastAppError(APP_MESSAGE_CODE.error.common.unknown);
        return null;
      }

      if (options?.showLoading !== false) {
        setIsDrawParticipantLoading(true);
      }

      try {
        const result = await getChannelLiveDrawParticipantsAction({
          broadcastId,
          drawNoticeId: targetSession.noticeId,
          endedAt,
          startedAt: targetSession.startedAt,
        });

        if (!result.success || !result.data) {
          toastAppError(result.code ?? APP_MESSAGE_CODE.error.common.unknown);
          return null;
        }

        return result.data.participants;
      } catch (error) {
        console.error("방송 추첨 참여자 조회 액션 실패", error);
        toastAppError(APP_MESSAGE_CODE.error.common.unknown);
        return null;
      } finally {
        if (options?.showLoading !== false) {
          setIsDrawParticipantLoading(false);
        }
      }
    },
    [broadcastId],
  );

  const closeDrawRecruitment = useCallback(
    async (targetSession: DrawState) => {
      if (targetSession.endedAt) {
        return targetSession;
      }

      const endedAt = new Date().toISOString();
      const participants = await loadDrawParticipants(targetSession, endedAt);

      if (!participants) {
        return null;
      }

      const noticeId = await publishInteractionNotice({
        content: "추첨 모집이 종료되었습니다.",
        interactionType: "draw",
        metadata: {
          drawNoticeId: targetSession.noticeId,
          participantCount: participants.length,
          resultLabel: "추첨 모집 종료",
          status: "ended",
        },
      });

      if (!noticeId) {
        return null;
      }

      const nextSession = { ...targetSession, endedAt, participants };

      setDrawSession(nextSession);
      clearDrawTimer();

      return nextSession;
    },
    [clearDrawTimer, loadDrawParticipants, publishInteractionNotice],
  );

  const handleToggleDrawRecruitment = async () => {
    if (isDrawing || isDrawParticipantLoading || isDrawRecruitmentPending) return;

    if (!drawSession || drawSession.endedAt) {
      await handleStartDraw();
      return;
    }

    await closeDrawRecruitment(drawSession);
  };

  useEffect(() => {
    clearDrawTimer();

    if (
      !activeDrawNoticeId ||
      !activeDrawStartedAt ||
      !isDrawTimerEnabled ||
      normalizedDrawTimerSeconds <= 0
    ) {
      return;
    }

    const targetSession: DrawState = {
      endedAt: null,
      noticeId: activeDrawNoticeId,
      participants: [],
      startedAt: activeDrawStartedAt,
      winnerUserIds: [],
    };

    drawTimerTimeoutRef.current = setTimeout(() => {
      void closeDrawRecruitment(targetSession);
    }, normalizedDrawTimerSeconds * 1000);

    return clearDrawTimer;
  }, [
    activeDrawNoticeId,
    activeDrawStartedAt,
    clearDrawTimer,
    closeDrawRecruitment,
    isDrawTimerEnabled,
    normalizedDrawTimerSeconds,
  ]);

  useEffect(() => {
    if (!activeDrawNoticeId || !activeDrawStartedAt) return;

    let isCancelled = false;
    const targetSession: DrawState = {
      endedAt: null,
      noticeId: activeDrawNoticeId,
      participants: [],
      startedAt: activeDrawStartedAt,
      winnerUserIds: [],
    };

    const refreshParticipants = async () => {
      const participants = await loadDrawParticipants(targetSession, new Date().toISOString(), {
        showLoading: false,
      });

      if (!participants || isCancelled) return;

      setDrawSession((currentSession) =>
        currentSession?.noticeId === activeDrawNoticeId && !currentSession.endedAt
          ? { ...currentSession, participants }
          : currentSession,
      );
    };

    void refreshParticipants();
    const refreshInterval = setInterval(() => {
      void refreshParticipants();
    }, 3000);

    return () => {
      isCancelled = true;
      clearInterval(refreshInterval);
    };
  }, [activeDrawNoticeId, activeDrawStartedAt, loadDrawParticipants]);

  const handlePickDrawWinner = async () => {
    if (!drawSession) return;

    let nextSession = drawSession;

    if (!nextSession.endedAt) {
      const closedSession = await closeDrawRecruitment(nextSession);

      if (!closedSession) return;

      nextSession = closedSession;
    }

    const nextParticipants = filterChannelLiveDrawParticipants(
      nextSession.participants,
      nextSession.winnerUserIds,
      {
        excludePreviousWinners: isDrawExcludePreviousWinners,
        followerOnly: isDrawFollowerOnly,
      },
    );
    const winner = pickRandomItem(nextParticipants);

    if (!winner || isDrawing) {
      if (!winner) {
        toastAppError(APP_MESSAGE_CODE.error.common.unknown);
      }

      return;
    }

    const nextParticipantNames = toDrawParticipantNames(nextParticipants);
    const winnerIndex = nextParticipants.findIndex(
      (participant) => participant.userId === winner.userId,
    );
    const repeatedReelNames = Array.from(
      { length: DRAW_REEL_REPEAT_COUNT },
      () => nextParticipantNames,
    ).flat();
    const finalReelNames = [...repeatedReelNames, ...nextParticipantNames];
    const nextTargetIndex =
      repeatedReelNames.length + (winnerIndex >= 0 ? winnerIndex : nextParticipants.length - 1);
    const nextWinnerUserIds = [...nextSession.winnerUserIds, winner.userId];
    const winnerNameById = new Map(
      nextSession.participants.map((participant) => [participant.userId, participant.nickname]),
    );
    const nextWinnerNames = nextWinnerUserIds.map(
      (winnerUserId) => winnerNameById.get(winnerUserId) ?? "시청자",
    );

    setIsDrawing(true);
    setDrawRollingName(null);
    setDrawReelNames(finalReelNames);
    setDrawReelTargetIndex(0);

    if (drawSpinStartTimeoutRef.current) {
      clearTimeout(drawSpinStartTimeoutRef.current);
    }

    if (drawTimeoutRef.current) {
      clearTimeout(drawTimeoutRef.current);
    }

    drawSpinStartTimeoutRef.current = setTimeout(() => {
      setDrawReelTargetIndex(nextTargetIndex);
    }, 50);

    drawTimeoutRef.current = setTimeout(() => {
      if (drawSpinStartTimeoutRef.current) {
        clearTimeout(drawSpinStartTimeoutRef.current);
        drawSpinStartTimeoutRef.current = null;
      }

      setDrawRollingName(winner.nickname);
      setDrawReelNames([]);
      setDrawReelTargetIndex(0);
      setDrawSession((currentSession) =>
        currentSession
          ? {
              ...currentSession,
              winnerUserIds: nextWinnerUserIds,
            }
          : currentSession,
      );
      setIsDrawing(false);
      void publishInteractionNotice({
        content: `추첨 결과 ${winner.nickname}`,
        interactionType: "draw",
        metadata: {
          drawNoticeId: nextSession.noticeId,
          participantCount: nextParticipants.length,
          resultLabel: winner.nickname,
          status: "ended",
          winnerNames: nextWinnerNames,
        },
      });
    }, DRAW_REEL_DURATION_MS);
  };

  // 뒤로가기: 모집 중이면 종료 공지를 발행하고, 성공해야 도구를 떠난다.
  const exitTool = async () => {
    if (isDrawRecruitmentPending) return false;

    if (drawSession && !drawSession.endedAt && drawSession.noticeId) {
      const noticeId = await publishInteractionNotice({
        content: "추첨이 종료되었습니다.",
        interactionType: "draw",
        metadata: {
          drawNoticeId: drawSession.noticeId,
          resultLabel: "추첨 종료",
          status: "ended",
        },
      });

      if (!noticeId) return false;
    }

    resetDrawState();
    return true;
  };

  return {
    canPickDrawWinner,
    drawParticipants,
    drawReelNames,
    drawReelTargetIndex,
    drawRollingName,
    drawSession,
    drawTimerSeconds,
    drawWinnerNames,
    exitTool,
    handleDrawTimerSecondsChange,
    handlePickDrawWinner,
    handleToggleDrawRecruitment,
    isDrawExcludePreviousWinners,
    isDrawFollowerOnly,
    isDrawing,
    isDrawParticipantLoading,
    isDrawRecruiting,
    isDrawRecruitmentPending,
    isDrawTimerEnabled,
    setIsDrawExcludePreviousWinners,
    setIsDrawFollowerOnly,
    setIsDrawTimerEnabled,
  };
}

export type ChannelLiveDrawTool = ReturnType<typeof useChannelLiveDrawTool>;
