"use client";
// 방송 운영 화면에서 채팅 기반 투표, DB 기준 추첨, 룰렛 도구를 렌더링합니다.

import {
  getChannelLiveDrawParticipantsAction,
  type ChannelLiveChatMessage,
  type ChannelLiveDrawParticipant,
} from "@/actions/channel/live";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { cn } from "@/lib/utils";
import { toastAppError } from "@/utils/common/toast-message";
import { ArrowLeft, FerrisWheel, Gift, Plus, RotateCw, Trophy, Users, Vote, X } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

interface Props {
  broadcastId: string | null;
  messages: ChannelLiveChatMessage[];
}

interface PollState {
  endedAt: string | null;
  options: string[];
  startedAt: string;
  title: string;
}

interface DrawState {
  endedAt: string | null;
  participants: ChannelLiveDrawParticipant[];
  startedAt: string;
  winnerNames: string[];
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
const MAX_POLL_OPTION_COUNT = 4;
const VOTE_COMMAND = "!투표";
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

function parseVoteIndex(content: string, options: string[]) {
  const trimmedContent = content.trim();

  if (!trimmedContent.startsWith(VOTE_COMMAND)) {
    return null;
  }

  const voteValue = trimmedContent.slice(VOTE_COMMAND.length).trim();

  if (!voteValue) {
    return null;
  }

  const numericIndex = Number(voteValue);

  if (Number.isInteger(numericIndex) && numericIndex >= 1 && numericIndex <= options.length) {
    return numericIndex - 1;
  }

  const normalizedVoteValue = voteValue.toLocaleLowerCase();
  const matchedIndex = options.findIndex(
    (option) => option.toLocaleLowerCase() === normalizedVoteValue,
  );

  return matchedIndex >= 0 ? matchedIndex : null;
}

function getPollResults(messages: ChannelLiveChatMessage[], poll: PollState | null) {
  if (!poll) {
    return [];
  }

  const votesByAuthor = new Map<string, number>();

  messages.forEach((message) => {
    if (!isMessageInPeriod(message, poll.startedAt, poll.endedAt)) {
      return;
    }

    const voteIndex = parseVoteIndex(message.content, poll.options);

    if (voteIndex === null) {
      return;
    }

    votesByAuthor.set(message.authorName, voteIndex);
  });

  const voteCounts = poll.options.map(() => 0);

  votesByAuthor.forEach((voteIndex) => {
    voteCounts[voteIndex] += 1;
  });

  const totalVotes = voteCounts.reduce((total, count) => total + count, 0);

  return poll.options.map<PollResult>((option, index) => ({
    count: voteCounts[index],
    option,
    percent: totalVotes > 0 ? Math.round((voteCounts[index] / totalVotes) * 100) : 0,
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

export default function ChannelLivePollPanel({ broadcastId, messages }: Props) {
  const [selectedTool, setSelectedTool] = useState<InteractionTool | null>(null);
  const [activePoll, setActivePoll] = useState<PollState | null>(null);
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(DEFAULT_POLL_OPTIONS);
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
  const canCreatePoll = title.trim().length > 0 && trimmedOptions.length >= 2;
  const pollResults = useMemo(() => getPollResults(messages, activePoll), [activePoll, messages]);
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
  const drawableParticipants = drawParticipants.filter(
    (participant) => !drawSession?.winnerNames.includes(participant),
  );
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

  const handleCreatePoll = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canCreatePoll) return;

    setActivePoll({
      endedAt: null,
      options: trimmedOptions,
      startedAt: new Date().toISOString(),
      title: title.trim(),
    });
    setTitle("");
    setOptions(DEFAULT_POLL_OPTIONS);
  };

  const handleEndPoll = () => {
    setActivePoll((currentPoll) =>
      currentPoll ? { ...currentPoll, endedAt: new Date().toISOString() } : currentPoll,
    );
  };

  const handleStartDraw = () => {
    setDrawSession({
      endedAt: null,
      participants: [],
      startedAt: new Date().toISOString(),
      winnerNames: [],
    });
    setDrawRollingName(null);
    setDrawReelNames([]);
    setDrawReelTargetIndex(0);
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

    const dbParticipantNames = toDrawParticipantNames(nextSession.participants);
    const availableParticipants = dbParticipantNames.filter(
      (participant) => !nextSession.winnerNames.includes(participant),
    );
    const nextParticipants =
      availableParticipants.length > 0 ? availableParticipants : dbParticipantNames;
    const winnerName = pickRandomItem(nextParticipants);

    if (!winnerName || isDrawing) return;

    const winnerIndex = nextParticipants.findIndex((participant) => participant === winnerName);
    const repeatedReelNames = Array.from(
      { length: DRAW_REEL_REPEAT_COUNT },
      () => nextParticipants,
    ).flat();
    const finalReelNames = [...repeatedReelNames, ...nextParticipants];
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

      setDrawRollingName(winnerName);
      setDrawReelNames([]);
      setDrawReelTargetIndex(0);
      setDrawSession((currentSession) =>
        currentSession
          ? {
              ...currentSession,
              winnerNames: [...currentSession.winnerNames, winnerName],
            }
          : currentSession,
      );
      setIsDrawing(false);
    }, DRAW_REEL_DURATION_MS);
  };

  const handleAddRouletteItem = () => {
    const nextItem = rouletteInput.trim();

    if (!nextItem) return;

    setRouletteItems((currentItems) => [...currentItems, nextItem]);
    setRouletteInput("");
    setRouletteResult(null);
  };

  const handleRemoveRouletteItem = (index: number) => {
    setRouletteItems((currentItems) =>
      currentItems.filter((_, currentIndex) => currentIndex !== index),
    );
    setRouletteResult(null);
  };

  const handleSpinRoulette = () => {
    if (rouletteItems.length === 0 || isRouletteSpinning) return;

    const nextRotation = rouletteRotation + 1440 + Math.random() * 360;

    setIsRouletteSpinning(true);
    setRouletteResult(null);
    setRouletteRotation(nextRotation);

    if (rouletteTimeoutRef.current) {
      clearTimeout(rouletteTimeoutRef.current);
    }

    rouletteTimeoutRef.current = setTimeout(() => {
      const winnerIndex = getRouletteWinnerIndex(nextRotation, rouletteItems.length);

      if (winnerIndex !== null) {
        setRouletteResult(rouletteItems[winnerIndex]);
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
              {activePoll ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <strong className="text-sm leading-5">{activePoll.title}</strong>
                      <p className="text-muted-foreground mt-1 text-xs font-semibold">
                        {activePoll.endedAt
                          ? "투표가 종료되었습니다."
                          : "`!투표 1` 또는 `!투표 선택지`로 참여합니다."}
                      </p>
                    </div>
                    {activePoll.endedAt ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-xl font-bold"
                        onClick={() => setActivePoll(null)}
                      >
                        초기화
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-xl font-bold"
                        onClick={handleEndPoll}
                      >
                        종료
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
                  <div className="flex flex-col gap-1.5">
                    <label className="text-muted-foreground text-xs font-semibold">투표 제목</label>
                    <Input
                      value={title}
                      maxLength={50}
                      placeholder="투표 제목을 입력해주세요."
                      className="border-border bg-muted/30 h-10 rounded-xl px-4 text-sm"
                      onChange={(event) => setTitle(event.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-muted-foreground text-xs font-semibold">선택지</label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-xl font-bold"
                        disabled={options.length >= MAX_POLL_OPTION_COUNT}
                        onClick={handleAddOption}
                      >
                        <Plus className="size-3.5" />
                        추가
                      </Button>
                    </div>
                    <div className="grid gap-2">
                      {options.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={option}
                            maxLength={24}
                            placeholder={`선택지 ${index + 1}`}
                            className="border-border bg-muted/30 h-10 rounded-xl px-4 text-sm"
                            onChange={(event) => handleOptionChange(index, event.target.value)}
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="rounded-xl"
                            disabled={options.length <= 2}
                            onClick={() => handleRemoveOption(index)}
                          >
                            <X className="size-4" />
                            <span className="sr-only">선택지 삭제</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={!canCreatePoll}
                    className="bg-brand hover:bg-brand/90 mt-auto h-10 rounded-xl font-bold text-white"
                  >
                    투표 시작
                  </Button>
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

              {drawSession?.winnerNames.length ? (
                <div className="bg-brand/10 text-brand flex flex-col gap-2 rounded-xl px-3 py-3 text-sm font-bold">
                  <div className="flex items-center gap-2">
                    <Trophy className="size-4" />
                    당첨자
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {drawSession.winnerNames.map((winnerName, index) => (
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
