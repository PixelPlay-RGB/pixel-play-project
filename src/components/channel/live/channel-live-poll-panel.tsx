"use client";
// 방송 운영 화면에서 채팅 기반 투표, DB 기준 추첨, 룰렛 도구를 렌더링합니다.

import {
  createChannelLivePollAction,
  endChannelLivePollAction,
  getChannelLiveDrawParticipantsAction,
  sendChannelLiveInteractionNoticeAction,
  type ChannelLiveChatMessage,
  type ChannelLiveDrawParticipant,
} from "@/actions/channel/live";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { useLivePolls } from "@/hooks/live/use-live-polls";
import { cn } from "@/lib/utils";
import type { LivePoll } from "@/types/live/live";
import { toastAppError } from "@/utils/common/toast-message";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FerrisWheel, Gift, Plus, RotateCw, Trophy, Users, Vote, X } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

interface Props {
  broadcastId: string | null;
  creatorId?: string;
  messages: ChannelLiveChatMessage[];
}

interface DrawState {
  endedAt: string | null;
  participants: ChannelLiveDrawParticipant[];
  startedAt: string;
  winnerUserIds: string[];
}

interface PollResult {
  count: number;
  option: string;
  percent: number;
}

type InteractionTool = "poll" | "draw" | "roulette";

const DEFAULT_POLL_OPTIONS = ["", ""];
const DEFAULT_ROULETTE_ITEMS = ["당첨", "다시 뽑기", "꽝"];
const ROULETTE_SEGMENT_COLORS = [
  "var(--brand)",
  "var(--live)",
  "var(--info)",
  "var(--warning)",
  "var(--success)",
  "var(--muted-foreground)",
];
const MAX_POLL_OPTION_COUNT = 5;
const POLL_TIMER_MAX_SECONDS = 3600;
const DRAW_REEL_ROW_HEIGHT_PX = 40;
const DRAW_REEL_REPEAT_COUNT = 9;
const DRAW_REEL_DURATION_MS = 2200;

const INTERACTION_TOOLS = [
  { icon: Vote, label: "투표", value: "poll" },
  { icon: Gift, label: "추첨", value: "draw" },
  { icon: FerrisWheel, label: "룰렛", value: "roulette" },
] as const;

function getMessageTime(message: ChannelLiveChatMessage) {
  const messageTime = new Date(message.createdAt).getTime();

  return Number.isFinite(messageTime) ? messageTime : 0;
}

function isMessageInPeriod(
  message: ChannelLiveChatMessage,
  startedAt: string,
  endedAt: string | null,
) {
  const messageTime = getMessageTime(message);
  const startedTime = new Date(startedAt).getTime();
  const endedTime = endedAt ? new Date(endedAt).getTime() : Number.POSITIVE_INFINITY;

  return messageTime >= startedTime && messageTime <= endedTime;
}

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

function getDrawParticipants(messages: ChannelLiveChatMessage[], drawSession: DrawState | null) {
  if (!drawSession) {
    return [];
  }

  const participants = new Set<string>();

  messages.forEach((message) => {
    if (!isMessageInPeriod(message, drawSession.startedAt, drawSession.endedAt)) {
      return;
    }

    const authorName = message.authorName.trim();

    if (authorName) {
      participants.add(authorName);
    }
  });

  return Array.from(participants);
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

function getRouletteItemLabelStyle(index: number, itemCount: number) {
  if (itemCount === 0) {
    return {};
  }

  const segmentDegree = 360 / itemCount;
  const labelDegree = index * segmentDegree + segmentDegree / 2;

  return {
    transform: `translate(-50%, -50%) rotate(${labelDegree}deg) translateY(-58px)`,
  };
}

function getRouletteWinnerIndex(rotation: number, itemCount: number) {
  if (itemCount === 0) {
    return null;
  }

  const normalizedRotation = ((rotation % 360) + 360) % 360;
  const pointedDegree = (360 - normalizedRotation) % 360;
  const segmentDegree = 360 / itemCount;

  return Math.floor(pointedDegree / segmentDegree);
}

export default function ChannelLivePollPanel({ broadcastId, creatorId, messages }: Props) {
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
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawParticipantLoading, setIsDrawParticipantLoading] = useState(false);
  const [drawRollingName, setDrawRollingName] = useState<string | null>(null);
  const [drawReelNames, setDrawReelNames] = useState<string[]>([]);
  const [drawReelTargetIndex, setDrawReelTargetIndex] = useState(0);
  const [rouletteInput, setRouletteInput] = useState("");
  const [rouletteItems, setRouletteItems] = useState(DEFAULT_ROULETTE_ITEMS);
  const [rouletteResult, setRouletteResult] = useState<string | null>(null);
  const [rouletteRotation, setRouletteRotation] = useState(0);
  const [isRouletteSpinning, setIsRouletteSpinning] = useState(false);
  const drawSpinStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drawTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rouletteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmedOptions = options.map((option) => option.trim()).filter(Boolean);
  const activePoll = polls.find((poll) => poll.status === "active") ?? null;
  const latestEndedPoll = [...polls].reverse().find((poll) => poll.status === "ended") ?? null;
  const visiblePoll = activePoll ?? (isPollFormOpen ? null : latestEndedPoll);
  const normalizedPollTimerSeconds = Math.min(
    Math.max(Math.floor(pollTimerSeconds), 0),
    POLL_TIMER_MAX_SECONDS,
  );
  const canCreatePoll =
    !!broadcastId &&
    !activePoll &&
    title.trim().length > 0 &&
    trimmedOptions.length >= 2 &&
    (!isPollTimerEnabled || normalizedPollTimerSeconds > 0);
  const pollResults = useMemo(() => getPollResults(visiblePoll), [visiblePoll]);
  const totalVotes = pollResults.reduce((total, result) => total + result.count, 0);
  const previewDrawParticipants = useMemo(
    () => getDrawParticipants(messages, drawSession),
    [drawSession, messages],
  );
  const isDrawParticipantConfirmed = Boolean(drawSession?.endedAt);
  const confirmedDrawParticipants =
    isDrawParticipantConfirmed && drawSession
      ? toDrawParticipantNames(drawSession.participants)
      : [];
  const drawParticipants = isDrawParticipantConfirmed
    ? confirmedDrawParticipants
    : previewDrawParticipants;
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
  const selectedToolLabel = INTERACTION_TOOLS.find((tool) => tool.value === selectedTool)?.label;
  const rouletteSegmentStyle = useMemo(() => {
    if (rouletteItems.length === 0) {
      return { background: "var(--muted)" };
    }

    const segmentSize = 100 / rouletteItems.length;
    const stops = rouletteItems.map((_, index) => {
      const color = ROULETTE_SEGMENT_COLORS[index % ROULETTE_SEGMENT_COLORS.length];
      const start = index * segmentSize;
      const end = (index + 1) * segmentSize;

      return `${color} ${start}% ${end}%`;
    });

    return { background: `conic-gradient(${stops.join(", ")})` };
  }, [rouletteItems]);

  useEffect(() => {
    return () => {
      if (drawSpinStartTimeoutRef.current) {
        clearTimeout(drawSpinStartTimeoutRef.current);
      }

      if (drawTimeoutRef.current) {
        clearTimeout(drawTimeoutRef.current);
      }

      if (rouletteTimeoutRef.current) {
        clearTimeout(rouletteTimeoutRef.current);
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
    if (options.length >= MAX_POLL_OPTION_COUNT) return;

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

  const handleStartDraw = () => {
    setDrawSession({
      endedAt: null,
      participants: [],
      startedAt: new Date().toISOString(),
      winnerUserIds: [],
    });
    setDrawRollingName(null);
    setDrawReelNames([]);
    setDrawReelTargetIndex(0);
    void publishInteractionNotice({
      content: "추첨 모집이 시작되었습니다.",
      interactionType: "draw",
      metadata: {
        resultLabel: "추첨 모집 중",
        status: "active",
      },
    });
  };

  const loadDrawParticipants = async (targetSession: DrawState, endedAt: string) => {
    if (!broadcastId) {
      toastAppError(APP_MESSAGE_CODE.error.common.unknown);
      return null;
    }

    setIsDrawParticipantLoading(true);

    try {
      const result = await getChannelLiveDrawParticipantsAction({
        broadcastId,
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
      setIsDrawParticipantLoading(false);
    }
  };

  const publishInteractionNotice = async ({
    content,
    interactionType,
    metadata,
  }: {
    content: string;
    interactionType: "draw" | "roulette";
    metadata: Record<string, unknown>;
  }) => {
    if (!broadcastId) return;

    try {
      const result = await sendChannelLiveInteractionNoticeAction({
        broadcastId,
        content,
        interactionType,
        metadata,
      });

      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.common.unknown);
      }
    } catch (error) {
      console.error("라이브 상호작용 결과 공지 액션 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.common.unknown);
    }
  };

  const handleEndDraw = async () => {
    if (!drawSession || drawSession.endedAt) return;

    const endedAt = new Date().toISOString();
    const participants = await loadDrawParticipants(drawSession, endedAt);

    if (!participants) return;

    setDrawSession((currentSession) =>
      currentSession ? { ...currentSession, endedAt, participants } : currentSession,
    );
  };

  const handlePickDrawWinner = async () => {
    if (!drawSession) return;

    let nextSession = drawSession;

    if (!nextSession.endedAt || nextSession.participants.length === 0) {
      const endedAt = nextSession.endedAt ?? new Date().toISOString();
      const participants = await loadDrawParticipants(nextSession, endedAt);

      if (!participants) return;

      nextSession = { ...nextSession, endedAt, participants };
      setDrawSession(nextSession);
    }

    const availableParticipants = nextSession.participants.filter(
      (participant) => !nextSession.winnerUserIds.includes(participant.userId),
    );
    const nextParticipants =
      availableParticipants.length > 0 ? availableParticipants : nextSession.participants;
    const winner = pickRandomItem(nextParticipants);

    if (!winner || isDrawing) return;

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
          participantCount: nextSession.participants.length,
          resultLabel: winner.nickname,
          status: "ended",
          winnerNames: [winner.nickname],
        },
      });
    }, DRAW_REEL_DURATION_MS);
  };

  const handleAddRouletteItem = () => {
    if (isRouletteSpinning) return;

    const nextItem = rouletteInput.trim();

    if (!nextItem) return;

    setRouletteItems((currentItems) => [...currentItems, nextItem]);
    setRouletteInput("");
    setRouletteResult(null);
  };

  const handleRemoveRouletteItem = (index: number) => {
    if (isRouletteSpinning) return;

    setRouletteItems((currentItems) =>
      currentItems.filter((_, currentIndex) => currentIndex !== index),
    );
    setRouletteResult(null);
  };

  const handleSpinRoulette = () => {
    if (rouletteItems.length === 0 || isRouletteSpinning) return;

    const spinningItems = [...rouletteItems];
    const nextRotation = rouletteRotation + 1440 + Math.random() * 360;

    setIsRouletteSpinning(true);
    setRouletteResult(null);
    setRouletteRotation(nextRotation);
    void publishInteractionNotice({
      content: "룰렛을 돌리는 중입니다.",
      interactionType: "roulette",
      metadata: {
        resultLabel: "룰렛 진행 중",
        status: "active",
      },
    });

    if (rouletteTimeoutRef.current) {
      clearTimeout(rouletteTimeoutRef.current);
    }

    rouletteTimeoutRef.current = setTimeout(() => {
      const winnerIndex = getRouletteWinnerIndex(nextRotation, spinningItems.length);

      if (winnerIndex !== null) {
        const nextResult = spinningItems[winnerIndex];

        setRouletteResult(nextResult);
        void publishInteractionNotice({
          content: `룰렛 결과 ${nextResult}`,
          interactionType: "roulette",
          metadata: {
            resultLabel: nextResult,
            status: "ended",
          },
        });
      }

      setIsRouletteSpinning(false);
    }, 1700);
  };

  return (
    <section className="border-border bg-card flex min-h-96 min-w-0 flex-col gap-4 rounded-xl border p-4 shadow-sm">
      {selectedTool === null ? (
        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          {INTERACTION_TOOLS.map(({ icon: Icon, label, value }) => (
            <button
              key={value}
              type="button"
              className={cn(
                "border-border bg-background text-foreground flex min-h-28 flex-col items-center justify-center gap-3 rounded-xl border px-4 py-5 text-sm font-bold shadow-sm transition-colors",
                "hover:border-brand/40 hover:bg-brand/5 hover:text-brand",
              )}
              onClick={() => setSelectedTool(value)}
            >
              <span className="bg-brand/10 text-brand flex size-16 items-center justify-center rounded-full">
                <Icon className="size-8" />
              </span>
              {label}
            </button>
          ))}
        </div>
      ) : (
        <>
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
            <div className="flex flex-1 flex-col gap-3">
              {isPollLoading ? (
                <div className="border-border text-muted-foreground flex min-h-32 items-center justify-center rounded-xl border text-sm font-semibold">
                  투표를 불러오는 중입니다.
                </div>
              ) : visiblePoll ? (
                <div className="flex flex-col gap-3">
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
                  <div className="grid gap-2">
                    {pollResults.map((result, index) => (
                      <div
                        key={`${result.option}-${index}`}
                        className="border-border bg-background overflow-hidden rounded-xl border"
                      >
                        <div className="flex items-center justify-between gap-2 px-3 pt-2">
                          <span className="text-sm font-semibold">{result.option}</span>
                          <span className="text-muted-foreground text-xs font-bold">
                            {result.count}표 · {result.percent}%
                          </span>
                        </div>
                        <div className="bg-muted mx-3 mt-2 mb-3 h-2 overflow-hidden rounded-full">
                          <div
                            className="bg-brand h-full rounded-full transition-all"
                            style={{ width: `${result.percent}%` }}
                          />
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
                  className="border-border flex flex-1 flex-col gap-4 border-t pt-4"
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

                  <div className="flex min-h-0 flex-col gap-3">
                    <div className="grid max-h-56 gap-3 overflow-y-auto pr-1">
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
                    <div className="grid grid-cols-[4.25rem_minmax(0,1fr)_2.5rem] items-center gap-2">
                      <span aria-hidden />
                      <Button
                        type="button"
                        variant="outline"
                        className="border-brand text-brand hover:bg-brand/10 hover:text-brand h-10 rounded-xl font-bold"
                        disabled={options.length >= MAX_POLL_OPTION_COUNT}
                        onClick={handleAddOption}
                      >
                        <Plus className="size-3.5" />
                        항목 추가
                      </Button>
                      <span aria-hidden />
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
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
            <div className="flex flex-1 flex-col gap-3">
              <div className="bg-background border-border flex flex-col gap-3 rounded-xl border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="text-brand size-4" />
                    <span className="text-sm font-bold">
                      {isDrawParticipantLoading
                        ? "참여자 조회 중"
                        : `참여자 ${drawParticipants.length}명`}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs font-semibold">
                    {drawSession
                      ? drawSession.endedAt
                        ? "DB 기준 모집 종료"
                        : "모집 중"
                      : "모집 대기"}
                  </span>
                </div>
                {drawParticipants.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {drawParticipants.slice(0, 12).map((participant) => (
                      <span
                        key={participant}
                        className="bg-brand/10 text-brand rounded-full px-2.5 py-1 text-xs font-bold"
                      >
                        {participant}
                      </span>
                    ))}
                    {drawParticipants.length > 12 && (
                      <span className="text-muted-foreground px-2.5 py-1 text-xs font-bold">
                        +{drawParticipants.length - 12}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs font-semibold">
                    모집 시작 후 채팅을 친 사람이 추첨 후보에 들어갑니다.
                  </p>
                )}
              </div>

              <div
                className={cn(
                  "border-border bg-background mt-auto flex min-h-24 items-center justify-center overflow-hidden rounded-xl border px-4 py-3 text-center",
                  isDrawing && "border-live/40 bg-live/10",
                )}
              >
                {isDrawing && drawReelNames.length > 0 ? (
                  <div className="relative h-10 w-full overflow-hidden">
                    <div className="from-background pointer-events-none absolute inset-x-0 top-0 z-10 h-3 bg-linear-to-b to-transparent" />
                    <div className="from-background pointer-events-none absolute inset-x-0 bottom-0 z-10 h-3 bg-linear-to-t to-transparent" />
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
                  <span className="text-foreground text-lg font-black">
                    {drawRollingName ?? "추첨 대기"}
                  </span>
                )}
              </div>

              {drawWinnerNames.length ? (
                <div className="bg-brand/10 text-brand flex flex-col gap-2 rounded-xl px-3 py-3 text-sm font-bold">
                  <div className="flex items-center gap-2">
                    <Trophy className="size-4" />
                    당첨자
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {drawWinnerNames.map((winnerName, index) => (
                      <span
                        key={`${winnerName}-${index}`}
                        className="bg-background text-brand rounded-full px-2.5 py-1 text-xs font-bold"
                      >
                        {index + 1}. {winnerName}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl font-bold"
                  disabled={!broadcastId || isDrawParticipantLoading || isDrawing}
                  onClick={handleStartDraw}
                >
                  모집 시작
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl font-bold"
                  disabled={
                    !broadcastId ||
                    !drawSession ||
                    Boolean(drawSession.endedAt) ||
                    isDrawParticipantLoading ||
                    isDrawing
                  }
                  onClick={handleEndDraw}
                >
                  {isDrawParticipantLoading ? "조회 중" : "모집 종료"}
                </Button>
                <Button
                  type="button"
                  className="bg-brand hover:bg-brand/90 h-10 rounded-xl font-bold text-white"
                  disabled={!broadcastId || !drawSession || isDrawing || isDrawParticipantLoading}
                  onClick={handlePickDrawWinner}
                >
                  {isDrawParticipantLoading ? "조회 중" : isDrawing ? "추첨 중" : "추첨"}
                </Button>
              </div>
            </div>
          )}

          {selectedTool === "roulette" && (
            <div className="flex flex-1 flex-col gap-3">
              <div className="bg-background border-border flex flex-col items-center justify-center gap-3 rounded-xl border px-3 py-5 text-center">
                <div className="relative flex size-56 items-center justify-center">
                  <div className="absolute top-5 left-1/2 z-20 h-5 w-5 -translate-x-1/2 drop-shadow-md">
                    <div
                      className="bg-foreground absolute inset-0"
                      style={{
                        clipPath: "polygon(50% 100%, 0 0, 100% 0)",
                      }}
                    />
                    <div
                      className="bg-live absolute inset-0.5"
                      style={{
                        clipPath: "polygon(50% 100%, 0 0, 100% 0)",
                      }}
                    />
                  </div>
                  <div
                    className="border-background relative size-48 overflow-hidden rounded-full border-8 shadow-lg transition-transform duration-1000 ease-out"
                    style={{
                      ...rouletteSegmentStyle,
                      transform: `rotate(${rouletteRotation}deg)`,
                      transitionDuration: isRouletteSpinning ? "1700ms" : "1000ms",
                    }}
                  >
                    {rouletteItems.map((item, index) => (
                      <span
                        key={`${item}-${index}-wheel`}
                        className="absolute top-1/2 left-1/2 w-16 truncate text-center text-xs font-black text-white drop-shadow"
                        style={getRouletteItemLabelStyle(index, rouletteItems.length)}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <div className="bg-background border-border absolute flex size-20 flex-col items-center justify-center rounded-full border shadow-sm">
                    <FerrisWheel className="text-brand size-6" />
                    <span className="text-muted-foreground text-xs font-bold">ROULETTE</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <strong className="text-lg">
                    {isRouletteSpinning ? "돌리는 중" : (rouletteResult ?? "룰렛 대기")}
                  </strong>
                  <span className="text-muted-foreground text-xs font-semibold">
                    항목을 추가하고 룰렛을 돌립니다.
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  value={rouletteInput}
                  disabled={isRouletteSpinning}
                  maxLength={24}
                  placeholder="룰렛 항목"
                  className="border-border bg-background h-10 rounded-xl px-4 text-sm"
                  onChange={(event) => setRouletteInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return;

                    event.preventDefault();
                    handleAddRouletteItem();
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl font-bold"
                  disabled={isRouletteSpinning}
                  onClick={handleAddRouletteItem}
                >
                  추가
                </Button>
              </div>

              <div className="grid gap-2">
                {rouletteItems.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="border-border bg-background flex items-center justify-between gap-2 rounded-xl border px-3 py-2"
                  >
                    <span className="text-sm font-semibold">{item}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-xl"
                      disabled={isRouletteSpinning}
                      onClick={() => handleRemoveRouletteItem(index)}
                    >
                      <X className="size-4" />
                      <span className="sr-only">룰렛 항목 삭제</span>
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                className="bg-brand hover:bg-brand/90 h-10 rounded-xl font-bold text-white"
                disabled={rouletteItems.length === 0 || isRouletteSpinning}
                onClick={handleSpinRoulette}
              >
                <RotateCw className="size-4" />
                {isRouletteSpinning ? "돌리는 중" : "룰렛 돌리기"}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
