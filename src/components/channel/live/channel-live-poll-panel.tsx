"use client";
// 방송 운영 화면에서 채팅 기반 투표, DB 기준 추첨, 룰렛 도구를 렌더링합니다.

import {
  createChannelLivePollAction,
  endChannelLivePollAction,
  getChannelLiveDrawParticipantsAction,
  sendChannelLiveInteractionNoticeAction,
  type ChannelLiveDrawParticipant,
} from "@/actions/channel/live";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { useLivePolls } from "@/hooks/live/use-live-polls";
import { cn } from "@/lib/utils";
import type { LivePoll } from "@/types/live/live";
import { filterChannelLiveDrawParticipants } from "@/utils/channel/channel-live-draw";
import { toastAppError } from "@/utils/common/toast-message";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, FerrisWheel, Gift, Plus, RotateCw, Vote, X } from "lucide-react";
import { motion } from "motion/react";
import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

interface Props {
  broadcastId: string | null;
  creatorId?: string;
}

interface DrawState {
  endedAt: string | null;
  noticeId: string | null;
  participants: ChannelLiveDrawParticipant[];
  startedAt: string;
  winnerUserIds: string[];
}

interface PollResult {
  count: number;
  option: string;
  percent: number;
}

interface RouletteItem {
  label: string;
}

interface RouletteSegment {
  centerDegree: number;
  endPercent: number;
  index: number;
  item: RouletteItem;
  startPercent: number;
}

type InteractionTool = "poll" | "draw" | "roulette";

const DEFAULT_POLL_OPTIONS = ["", ""];
const DEFAULT_ROULETTE_ITEMS: RouletteItem[] = [
  { label: "당첨" },
  { label: "다시 뽑기" },
  { label: "꽝" },
];
const ROULETTE_SEGMENT_COLORS = [
  "var(--brand)",
  "var(--live)",
  "var(--info)",
  "var(--warning)",
  "var(--success)",
  "var(--muted-foreground)",
];
const POLL_TIMER_MAX_SECONDS = 3600;
const DRAW_TIMER_MAX_SECONDS = 3600;
const DRAW_REEL_ROW_HEIGHT_PX = 40;
const DRAW_REEL_REPEAT_COUNT = 9;
const DRAW_REEL_DURATION_MS = 2200;
const ROULETTE_SPIN_DURATION_SECONDS = 4.2;
const ROULETTE_SPIN_TURNS = 8;
const ROULETTE_POINTER_DEGREE = 45;
const ROULETTE_RECOIL_DEGREE = 46;

const INTERACTION_TOOLS = [
  { icon: Vote, label: "투표", value: "poll" },
  { icon: Gift, label: "추첨", value: "draw" },
  { icon: FerrisWheel, label: "룰렛", value: "roulette" },
] as const;

function getPollResults(poll: LivePoll | null) {
  if (!poll) {
    return [];
  }

  return poll.options.map<PollResult>((option) => ({
    count: option.count,
    option: option.label,
    percent: poll.totalCount > 0 ? Math.round((option.count / poll.totalCount) * 100) : 0,
  }));
}

function toDrawParticipantNames(participants: ChannelLiveDrawParticipant[]) {
  return participants.map((participant) => participant.nickname);
}

function pickRandomItem<T>(items: T[]) {
  if (items.length === 0) {
    return null;
  }

  return items[Math.floor(Math.random() * items.length)];
}

function getRouletteItemLabelStyle(centerDegree: number) {
  return {
    transform: `translate(-50%, -50%) rotate(${centerDegree}deg) translateY(-82px) rotate(${-centerDegree}deg)`,
  };
}

function normalizeRouletteDegree(degree: number) {
  return ((degree % 360) + 360) % 360;
}

function getRouletteItemPercent(itemCount: number) {
  if (itemCount <= 0) {
    return "0%";
  }

  const percent = 100 / itemCount;

  return `${percent.toFixed(percent % 1 === 0 ? 0 : 2)}%`;
}

function getValidRouletteItems(items: RouletteItem[]) {
  return items
    .map((item) => ({
      label: item.label.trim(),
    }))
    .filter((item) => item.label.length > 0);
}

function getRouletteSegments(items: RouletteItem[]) {
  const itemPercent = 100 / items.length;
  let currentPercent = 0;

  if (items.length === 0) {
    return [];
  }

  return items.map<RouletteSegment>((item, index) => {
    const startPercent = currentPercent;
    const endPercent = startPercent + itemPercent;
    const centerDegree = ((startPercent + itemPercent / 2) / 100) * 360;

    currentPercent = endPercent;

    return {
      centerDegree,
      endPercent,
      index,
      item,
      startPercent,
    };
  });
}

function pickRouletteSegment(segments: RouletteSegment[]) {
  if (segments.length === 0) {
    return null;
  }

  return segments[Math.floor(Math.random() * segments.length)] ?? null;
}

function getRouletteTargetRotation(currentRotation: number, targetDegree: number) {
  const targetRotation = normalizeRouletteDegree(ROULETTE_POINTER_DEGREE - targetDegree);
  const minRotation = currentRotation + ROULETTE_SPIN_TURNS * 360;
  let nextRotation = Math.floor(minRotation / 360) * 360 + targetRotation;

  while (nextRotation < minRotation) {
    nextRotation += 360;
  }

  return nextRotation;
}

function getRouletteTargetDegree(segment: RouletteSegment) {
  const segmentDegree = ((segment.endPercent - segment.startPercent) / 100) * 360;
  const safeOffsetLimit = Math.max(segmentDegree * 0.34, 0);

  if (safeOffsetLimit <= 0) {
    return segment.centerDegree;
  }

  const offsetDirection = Math.random() < 0.5 ? -1 : 1;
  const offsetAmount = safeOffsetLimit * (0.28 + Math.random() * 0.52);

  return segment.centerDegree + offsetDirection * offsetAmount;
}

export default function ChannelLivePollPanel({ broadcastId, creatorId }: Props) {
  const queryClient = useQueryClient();
  const { polls, isLoading: isPollLoading } = useLivePolls(broadcastId, creatorId);
  const [selectedTool, setSelectedTool] = useState<InteractionTool | null>(null);
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(DEFAULT_POLL_OPTIONS);
  const [isPollActionPending, setIsPollActionPending] = useState(false);
  const [isPollFormOpen, setIsPollFormOpen] = useState(false);
  const [isPollTimerEnabled, setIsPollTimerEnabled] = useState(false);
  const [pollTimerSeconds, setPollTimerSeconds] = useState(0);
  const [drawSession, setDrawSession] = useState<DrawState | null>(null);
  const [isDrawFollowerOnly, setIsDrawFollowerOnly] = useState(false);
  const [isDrawExcludePreviousWinners, setIsDrawExcludePreviousWinners] = useState(true);
  const [isDrawTimerEnabled, setIsDrawTimerEnabled] = useState(false);
  const [drawTimerSeconds, setDrawTimerSeconds] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawParticipantLoading, setIsDrawParticipantLoading] = useState(false);
  const [drawRollingName, setDrawRollingName] = useState<string | null>(null);
  const [drawReelNames, setDrawReelNames] = useState<string[]>([]);
  const [drawReelTargetIndex, setDrawReelTargetIndex] = useState(0);
  const [rouletteItems, setRouletteItems] = useState(DEFAULT_ROULETTE_ITEMS);
  const [isRouletteStarted, setIsRouletteStarted] = useState(false);
  const [rouletteResult, setRouletteResult] = useState<string | null>(null);
  const [rouletteRotation, setRouletteRotation] = useState(0);
  const [rouletteRotationKeyframes, setRouletteRotationKeyframes] = useState<number[]>([0]);
  const [pendingRouletteResult, setPendingRouletteResult] = useState<string | null>(null);
  const [isRouletteSpinning, setIsRouletteSpinning] = useState(false);
  const drawSpinStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drawTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drawTimerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmedOptions = options.map((option) => option.trim()).filter(Boolean);
  const activePoll = polls.find((poll) => poll.status === "active") ?? null;
  const latestEndedPoll = [...polls].reverse().find((poll) => poll.status === "ended") ?? null;
  const visiblePoll = activePoll ?? (isPollFormOpen ? null : latestEndedPoll);
  const normalizedPollTimerSeconds = Math.min(
    Math.max(Math.floor(pollTimerSeconds), 0),
    POLL_TIMER_MAX_SECONDS,
  );
  const normalizedDrawTimerSeconds = Math.min(
    Math.max(Math.floor(drawTimerSeconds), 0),
    DRAW_TIMER_MAX_SECONDS,
  );
  const canCreatePoll =
    !!broadcastId &&
    !activePoll &&
    title.trim().length > 0 &&
    trimmedOptions.length >= 2 &&
    (!isPollTimerEnabled || normalizedPollTimerSeconds > 0);
  const pollResults = useMemo(() => getPollResults(visiblePoll), [visiblePoll]);
  const totalVotes = pollResults.reduce((total, result) => total + result.count, 0);
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
  const validRouletteItems = useMemo(() => getValidRouletteItems(rouletteItems), [rouletteItems]);
  const rouletteSegments = useMemo(
    () => getRouletteSegments(validRouletteItems),
    [validRouletteItems],
  );
  const canStartRoulette = validRouletteItems.length >= 2;
  const selectedToolLabel = INTERACTION_TOOLS.find((tool) => tool.value === selectedTool)?.label;
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

  const handleOptionChange = (index: number, value: string) => {
    setOptions((currentOptions) =>
      currentOptions.map((currentOption, currentIndex) =>
        currentIndex === index ? value : currentOption,
      ),
    );
  };

  const handleAddOption = () => {
    setOptions((currentOptions) => [...currentOptions, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;

    setOptions((currentOptions) =>
      currentOptions.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  const handlePollTimerSecondsChange = (value: string) => {
    const nextValue = Number(value);

    if (!Number.isFinite(nextValue)) {
      setPollTimerSeconds(0);
      return;
    }

    setPollTimerSeconds(Math.min(Math.max(Math.floor(nextValue), 0), POLL_TIMER_MAX_SECONDS));
  };

  const handleDrawTimerSecondsChange = (value: string) => {
    const nextValue = Number(value);

    if (!Number.isFinite(nextValue)) {
      setDrawTimerSeconds(0);
      return;
    }

    setDrawTimerSeconds(Math.min(Math.max(Math.floor(nextValue), 0), DRAW_TIMER_MAX_SECONDS));
  };

  const invalidatePolls = () => {
    if (!broadcastId) return;

    void queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.live.polls(broadcastId),
    });
  };

  const handleCreatePoll = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!broadcastId || !canCreatePoll || isPollActionPending) return;

    setIsPollActionPending(true);

    try {
      const result = await createChannelLivePollAction({
        broadcastId,
        endsAt:
          isPollTimerEnabled && normalizedPollTimerSeconds > 0
            ? new Date(Date.now() + normalizedPollTimerSeconds * 1000).toISOString()
            : null,
        options: trimmedOptions,
        title: title.trim(),
      });

      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.common.unknown);
        return;
      }

      setTitle("");
      setOptions(DEFAULT_POLL_OPTIONS);
      setIsPollTimerEnabled(false);
      setPollTimerSeconds(0);
      setIsPollFormOpen(false);
      invalidatePolls();
    } catch (error) {
      console.error("방송 투표 생성 액션 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.common.unknown);
    } finally {
      setIsPollActionPending(false);
    }
  };

  const handleEndPoll = async () => {
    if (!activePoll || isPollActionPending) return;

    setIsPollActionPending(true);

    try {
      const result = await endChannelLivePollAction({ pollId: activePoll.id });

      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.common.unknown);
        return;
      }

      invalidatePolls();
    } catch (error) {
      console.error("방송 투표 종료 액션 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.common.unknown);
    } finally {
      setIsPollActionPending(false);
    }
  };

  const clearDrawTimer = useCallback(() => {
    if (!drawTimerTimeoutRef.current) return;

    clearTimeout(drawTimerTimeoutRef.current);
    drawTimerTimeoutRef.current = null;
  }, []);

  const handleStartDraw = async () => {
    const startedAt = new Date().toISOString();

    clearDrawTimer();
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
    const noticeId = await publishInteractionNotice({
      content: "추첨 모집이 시작되었습니다.",
      interactionType: "draw",
      metadata: {
        resultLabel: "추첨 모집 중",
        status: "active",
      },
    });

    if (!noticeId) return;

    setDrawSession((currentSession) =>
      currentSession?.startedAt === startedAt ? { ...currentSession, noticeId } : currentSession,
    );
  };

  const handleSelectTool = (tool: InteractionTool) => {
    setSelectedTool(tool);

    if (tool === "draw" && !drawSession) {
      void handleStartDraw();
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

      const nextSession = { ...targetSession, endedAt, participants };

      setDrawSession(nextSession);
      clearDrawTimer();

      return nextSession;
    },
    [clearDrawTimer, loadDrawParticipants],
  );

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

  const publishInteractionNotice = async ({
    content,
    interactionType,
    metadata,
  }: {
    content: string;
    interactionType: "draw" | "roulette";
    metadata: Record<string, unknown>;
  }) => {
    if (!broadcastId) return null;

    try {
      const result = await sendChannelLiveInteractionNoticeAction({
        broadcastId,
        content,
        interactionType,
        metadata,
      });

      if (!result.success || !result.data) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.common.unknown);
        return null;
      }

      return result.data.messageId;
    } catch (error) {
      console.error("라이브 상호작용 결과 공지 액션 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.common.unknown);
      return null;
    }
  };

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
              winnerUserIds: [...currentSession.winnerUserIds, winner.userId],
            }
          : currentSession,
      );
      setIsDrawing(false);
      void publishInteractionNotice({
        content: `추첨 결과 ${winner.nickname}`,
        interactionType: "draw",
        metadata: {
          participantCount: nextParticipants.length,
          resultLabel: winner.nickname,
          status: "ended",
          winnerNames: [winner.nickname],
        },
      });
    }, DRAW_REEL_DURATION_MS);
  };

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
    void publishInteractionNotice({
      content: "룰렛을 돌리는 중입니다.",
      interactionType: "roulette",
      metadata: {
        items: validRouletteItems.map((item) => item.label),
        resultLabel: "룰렛 진행 중",
        status: "active",
      },
    });
  };

  const handleRouletteAnimationComplete = () => {
    if (!isRouletteSpinning || !pendingRouletteResult) return;

    const nextResult = pendingRouletteResult;

    setRouletteResult(nextResult);
    setPendingRouletteResult(null);
    setIsRouletteSpinning(false);
    void publishInteractionNotice({
      content: `룰렛 결과 ${nextResult}`,
      interactionType: "roulette",
      metadata: {
        items: validRouletteItems.map((item) => item.label),
        resultLabel: nextResult,
        status: "ended",
      },
    });
  };

  return (
    <section className="border-border bg-card flex h-160 min-h-0 min-w-0 flex-col gap-4 rounded-xl border p-4 shadow-sm">
      {selectedTool === null ? (
        <div className="grid min-h-0 flex-1 content-center gap-3 sm:grid-cols-3">
          {INTERACTION_TOOLS.map(({ icon: Icon, label, value }) => (
            <button
              key={value}
              type="button"
              className={cn(
                "border-border bg-background text-foreground flex h-44 min-h-0 flex-col items-center justify-center gap-3 rounded-xl border px-4 py-5 text-sm font-bold shadow-sm transition-colors",
                "hover:border-brand/40 hover:bg-brand/5 hover:text-brand",
              )}
              onClick={() => handleSelectTool(value)}
            >
              <span className="bg-brand/10 text-brand flex size-16 items-center justify-center rounded-full">
                <Icon className="size-8" />
              </span>
              {label}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="rounded-xl font-bold"
              onClick={() => setSelectedTool(null)}
            >
              <ArrowLeft className="size-4" />
              뒤로가기
            </Button>
            <span className="text-muted-foreground text-xs font-bold">{selectedToolLabel}</span>
          </div>

          {selectedTool === "poll" && (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              {isPollLoading ? (
                <div className="border-border text-muted-foreground flex min-h-32 items-center justify-center rounded-xl border text-sm font-semibold">
                  투표를 불러오는 중입니다.
                </div>
              ) : visiblePoll ? (
                <div className="flex min-h-0 flex-1 flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <strong className="text-sm leading-5">{visiblePoll.title}</strong>
                      <p className="text-muted-foreground mt-1 text-xs font-semibold">
                        {visiblePoll.status === "ended"
                          ? "투표가 종료되었습니다."
                          : "시청자는 투표 참여 버튼으로 참여합니다."}
                      </p>
                    </div>
                    {visiblePoll.status === "ended" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-xl font-bold"
                        onClick={() => setIsPollFormOpen(true)}
                      >
                        새 투표
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-xl font-bold"
                        disabled={isPollActionPending}
                        onClick={() => void handleEndPoll()}
                      >
                        {isPollActionPending ? "종료 중" : "종료"}
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-2 overflow-y-auto pr-1">
                    {pollResults.map((result, index) => (
                      <div
                        key={`${result.option}-${index}`}
                        className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-3"
                      >
                        <span className="text-foreground truncate text-sm font-black">
                          {result.option}
                        </span>
                        <div className="bg-muted relative h-11 overflow-hidden rounded-xl">
                          <div
                            className="bg-brand absolute inset-y-0 left-0 rounded-xl transition-all"
                            style={{ width: `${result.percent}%` }}
                          />
                          <span className="text-foreground relative z-10 flex h-full items-center justify-end px-3 text-xs font-black tabular-nums">
                            {result.count}표 · {result.percent}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <span className="text-muted-foreground text-xs font-semibold">
                    현재 집계 {totalVotes}표
                  </span>
                </div>
              ) : (
                <form
                  onSubmit={handleCreatePoll}
                  className="border-border flex min-h-0 flex-1 flex-col gap-4 border-t pt-4"
                >
                  <div className="grid grid-cols-[4.25rem_minmax(0,1fr)_2.5rem] items-center gap-2">
                    <label
                      htmlFor="channel-live-poll-title"
                      className="text-foreground text-sm font-black"
                    >
                      제목
                    </label>
                    <Input
                      id="channel-live-poll-title"
                      value={title}
                      maxLength={50}
                      placeholder="투표 제목을 입력해주세요."
                      className="border-border bg-muted/30 h-10 rounded-xl px-4 text-sm"
                      onChange={(event) => setTitle(event.target.value)}
                    />
                    <span aria-hidden />
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col">
                    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
                      {options.map((option, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-[4.25rem_minmax(0,1fr)_2.5rem] items-center gap-2"
                        >
                          <span className="text-foreground text-sm font-black">
                            항목 {index + 1}
                          </span>
                          <Input
                            value={option}
                            maxLength={24}
                            placeholder="투표 이름"
                            className="border-border bg-muted/30 h-10 rounded-xl px-4 text-sm"
                            onChange={(event) => handleOptionChange(index, event.target.value)}
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-muted-foreground hover:text-foreground rounded-xl"
                            disabled={options.length <= 2}
                            onClick={() => handleRemoveOption(index)}
                          >
                            <X className="size-5" />
                            <span className="sr-only">항목 삭제</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 pt-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-brand text-brand hover:bg-brand/10 hover:text-brand h-11 w-full rounded-xl font-bold"
                      onClick={handleAddOption}
                    >
                      <Plus className="size-3.5" />
                      항목 추가
                    </Button>
                    <label className="text-foreground flex items-center gap-2 text-sm font-bold">
                      <input
                        type="checkbox"
                        checked={isPollTimerEnabled}
                        className="accent-brand size-4"
                        onChange={(event) => setIsPollTimerEnabled(event.target.checked)}
                      />
                      타이머 사용하기
                    </label>
                    <div className="flex items-center justify-end gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={POLL_TIMER_MAX_SECONDS}
                        value={pollTimerSeconds}
                        disabled={!isPollTimerEnabled}
                        className="border-border bg-muted/30 h-10 w-25 rounded-xl text-center text-sm font-bold"
                        onChange={(event) => handlePollTimerSecondsChange(event.target.value)}
                      />
                      <span className="text-foreground text-sm font-bold">초</span>
                    </div>
                    <Button
                      type="submit"
                      disabled={!canCreatePoll || isPollActionPending}
                      className="bg-brand hover:bg-brand/90 h-11 rounded-xl px-7 font-bold text-white shadow-sm transition-all active:scale-95"
                    >
                      {isPollActionPending ? "시작 중" : "투표 시작"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {selectedTool === "draw" && (
            <div className="flex min-h-0 flex-1 flex-col gap-5">
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
                <Button
                  type="button"
                  variant="outline"
                  className="border-brand text-brand hover:bg-brand/10 hover:text-brand h-16 rounded-lg px-8 text-base font-black"
                  disabled={!broadcastId || isDrawParticipantLoading || isDrawing}
                  onClick={() => void handleStartDraw()}
                >
                  참여자 다시 모집하기
                </Button>
                <Button
                  type="button"
                  className="bg-brand hover:bg-brand/90 h-16 rounded-lg px-8 text-base font-black text-white"
                  disabled={isDrawing || isDrawParticipantLoading}
                  onClick={handlePickDrawWinner}
                >
                  {isDrawParticipantLoading ? "조회 중" : isDrawing ? "추첨 중" : "추첨하기"}
                </Button>
              </div>

              <div className="flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <Button
                  type="button"
                  variant="outline"
                  aria-pressed={isDrawFollowerOnly}
                  className={cn(
                    "h-10 rounded-xl px-3 text-sm font-black",
                    isDrawFollowerOnly
                      ? "bg-brand hover:bg-brand/90 text-white hover:text-white"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  disabled={isDrawing || isDrawParticipantLoading}
                  onClick={() => setIsDrawFollowerOnly((current) => !current)}
                >
                  {isDrawFollowerOnly ? <Check className="size-4" /> : null}
                  구독자만 추첨하기
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  aria-pressed={isDrawExcludePreviousWinners}
                  className={cn(
                    "h-10 rounded-xl px-3 text-sm font-black",
                    isDrawExcludePreviousWinners
                      ? "bg-brand hover:bg-brand/90 text-white hover:text-white"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  disabled={isDrawing || isDrawParticipantLoading}
                  onClick={() => setIsDrawExcludePreviousWinners((current) => !current)}
                >
                  {isDrawExcludePreviousWinners ? <Check className="size-4" /> : null}
                  이미 뽑힌 참여자 제외하기
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  aria-pressed={isDrawTimerEnabled}
                  className={cn(
                    "h-10 rounded-xl px-3 text-sm font-black",
                    isDrawTimerEnabled
                      ? "bg-brand hover:bg-brand/90 text-white hover:text-white"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  disabled={isDrawing || isDrawParticipantLoading}
                  onClick={() => setIsDrawTimerEnabled((current) => !current)}
                >
                  {isDrawTimerEnabled ? <Check className="size-4" /> : null}
                  타이머 사용하기
                </Button>
                <div className="flex items-center justify-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={DRAW_TIMER_MAX_SECONDS}
                    value={drawTimerSeconds}
                    disabled={!isDrawTimerEnabled || isDrawing || isDrawParticipantLoading}
                    className="border-border bg-muted/30 h-10 w-25 rounded-xl text-center text-sm font-bold"
                    onChange={(event) => handleDrawTimerSecondsChange(event.target.value)}
                  />
                  <span className="text-foreground text-sm font-bold">초</span>
                </div>
              </div>

              <div className="border-border bg-background/60 flex min-h-0 flex-1 flex-col rounded-lg border">
                {isDrawing && drawReelNames.length > 0 ? (
                  <div className="relative m-auto h-10 w-full max-w-md overflow-hidden px-4">
                    <div className="from-background pointer-events-none absolute inset-x-4 top-0 z-10 h-3 bg-linear-to-b to-transparent" />
                    <div className="from-background pointer-events-none absolute inset-x-4 bottom-0 z-10 h-3 bg-linear-to-t to-transparent" />
                    <div
                      className="flex flex-col transition-transform ease-out"
                      style={{
                        transform: `translateY(-${drawReelTargetIndex * DRAW_REEL_ROW_HEIGHT_PX}px)`,
                        transitionDuration: `${DRAW_REEL_DURATION_MS - 150}ms`,
                        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    >
                      {drawReelNames.map((name, index) => (
                        <span
                          key={`${name}-${index}`}
                          className="text-live flex h-10 items-center justify-center text-lg font-black"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    {drawWinnerNames.length ? (
                      <div className="border-border mb-4 flex flex-wrap items-center gap-2 border-b pb-4">
                        <span className="text-brand text-sm font-black">당첨자</span>
                        {drawWinnerNames.map((winnerName, index) => (
                          <span
                            key={`${winnerName}-${index}`}
                            className="bg-brand/10 text-brand rounded-lg px-3 py-2 text-sm font-black"
                          >
                            {index + 1}. {winnerName}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {drawParticipants.length > 0 ? (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {drawParticipants.map((participant) => (
                          <span
                            key={participant}
                            className="bg-muted/50 text-foreground rounded-lg px-3 py-2 text-sm font-bold"
                          >
                            {participant}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-full min-h-72 items-center justify-center text-center">
                        <p className="text-muted-foreground text-sm font-semibold">
                          {drawRollingName
                            ? `최근 당첨자 ${drawRollingName}`
                            : "시청자가 추첨 참여 버튼을 누르면 후보에 들어갑니다."}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <span className="text-foreground text-sm font-black">
                  총 {drawParticipants.length}명
                </span>
              </div>
            </div>
          )}

          {selectedTool === "roulette" && (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              {!isRouletteStarted ? (
                <>
                  <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
                    {rouletteItems.map((item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-[4.25rem_minmax(0,1fr)_4.5rem_2.5rem] items-center gap-2"
                      >
                        <span className="text-foreground text-sm font-black">항목 {index + 1}</span>
                        <Input
                          value={item.label}
                          maxLength={24}
                          placeholder="투표 이름"
                          className="border-border bg-muted/30 h-10 rounded-xl px-4 text-sm"
                          onChange={(event) =>
                            handleRouletteItemLabelChange(index, event.target.value)
                          }
                        />
                        <span className="text-foreground text-right text-xs font-black tabular-nums">
                          {item.label.trim()
                            ? getRouletteItemPercent(validRouletteItems.length)
                            : "0%"}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-muted-foreground hover:text-foreground rounded-xl"
                          onClick={() => handleRemoveRouletteItem(index)}
                        >
                          <X className="size-5" />
                          <span className="sr-only">룰렛 항목 삭제</span>
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto grid gap-3 pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-brand text-brand hover:bg-brand/10 hover:text-brand h-14 w-full rounded-lg text-base font-black"
                      onClick={handleAddRouletteItem}
                    >
                      <Plus className="size-4" />
                      항목 추가
                    </Button>
                    <Button
                      type="button"
                      className="bg-brand hover:bg-brand/90 h-14 rounded-lg px-10 text-base font-black text-white"
                      disabled={!canStartRoulette}
                      onClick={handleStartRoulette}
                    >
                      룰렛 시작
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6">
                  <div className="relative flex size-72 items-center justify-center">
                    <div className="absolute top-8 right-10 z-20 rotate-[225deg] drop-shadow-lg">
                      <div
                        className="bg-border h-10 w-5"
                        style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }}
                      />
                      <div
                        className="bg-destructive absolute top-0.5 left-0.5 h-9 w-4"
                        style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }}
                      />
                    </div>
                    <motion.div
                      className="border-background relative size-64 overflow-hidden rounded-full border-8 shadow-lg"
                      style={rouletteSegmentStyle}
                      animate={{ rotate: rouletteRotationKeyframes }}
                      transition={
                        isRouletteSpinning
                          ? {
                              duration: ROULETTE_SPIN_DURATION_SECONDS,
                              ease: ["easeOut", "linear", "easeOut"],
                              times: [0, 0.14, 0.58, 1],
                            }
                          : { duration: 0 }
                      }
                      onAnimationComplete={handleRouletteAnimationComplete}
                    >
                      {rouletteSegments.map((segment) => (
                        <span
                          key={`${segment.item.label}-${segment.index}-wheel`}
                          className="absolute top-1/2 left-1/2 w-20 truncate text-center text-xs font-black text-white drop-shadow"
                          style={getRouletteItemLabelStyle(segment.centerDegree)}
                        >
                          {segment.item.label}
                        </span>
                      ))}
                    </motion.div>
                    <div className="bg-background border-border absolute flex size-20 flex-col items-center justify-center rounded-full border shadow-sm">
                      <FerrisWheel className="text-brand size-6" />
                      <span className="text-muted-foreground text-xs font-bold">ROULETTE</span>
                    </div>
                  </div>

                  <strong className="text-foreground text-lg font-black">
                    {isRouletteSpinning ? "돌리는 중" : (rouletteResult ?? "룰렛 대기")}
                  </strong>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-brand text-brand hover:bg-brand/10 hover:text-brand h-12 rounded-lg px-8 text-base font-black"
                      disabled={isRouletteSpinning}
                      onClick={handleResetRouletteItems}
                    >
                      항목 다시 설정하기
                    </Button>
                    <Button
                      type="button"
                      className="bg-brand hover:bg-brand/90 h-12 rounded-lg px-8 text-base font-black text-white"
                      disabled={!canStartRoulette || isRouletteSpinning}
                      onClick={handleSpinRoulette}
                    >
                      <RotateCw className="size-4" />
                      돌려!
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
