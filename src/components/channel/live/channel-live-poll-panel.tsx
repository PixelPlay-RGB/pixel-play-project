"use client";
// 방송 운영 화면에서 채팅 기반 투표, 추첨, 룰렛 도구를 렌더링합니다.

import type { ChannelLiveChatMessage } from "@/actions/channel/live";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  BarChart3,
  Gift,
  Plus,
  RotateCw,
  Sparkles,
  Trophy,
  Users,
  Vote,
  X,
} from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";

interface Props {
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
  startedAt: string;
  winnerName: string | null;
}

interface PollResult {
  count: number;
  option: string;
  percent: number;
}

type InteractionTool = "poll" | "draw" | "roulette";

const DEFAULT_POLL_OPTIONS = ["", ""];
const DEFAULT_ROULETTE_ITEMS = ["당첨", "다시 뽑기", "꽝"];
const MAX_POLL_OPTION_COUNT = 4;
const VOTE_COMMAND = "!투표";

const INTERACTION_TOOLS = [
  { icon: Vote, label: "투표", value: "poll" },
  { icon: Gift, label: "추첨", value: "draw" },
  { icon: RotateCw, label: "룰렛", value: "roulette" },
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

function pickRandomItem<T>(items: T[]) {
  if (items.length === 0) {
    return null;
  }

  return items[Math.floor(Math.random() * items.length)];
}

export default function ChannelLivePollPanel({ messages }: Props) {
  const [selectedTool, setSelectedTool] = useState<InteractionTool | null>(null);
  const [open, setOpen] = useState(false);
  const [activePoll, setActivePoll] = useState<PollState | null>(null);
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(DEFAULT_POLL_OPTIONS);
  const [drawSession, setDrawSession] = useState<DrawState | null>(null);
  const [rouletteInput, setRouletteInput] = useState("");
  const [rouletteItems, setRouletteItems] = useState(DEFAULT_ROULETTE_ITEMS);
  const [rouletteResult, setRouletteResult] = useState<string | null>(null);

  const trimmedOptions = options.map((option) => option.trim()).filter(Boolean);
  const canCreatePoll = title.trim().length > 0 && trimmedOptions.length >= 2;
  const pollResults = useMemo(() => getPollResults(messages, activePoll), [activePoll, messages]);
  const totalVotes = pollResults.reduce((total, result) => total + result.count, 0);
  const drawParticipants = useMemo(
    () => getDrawParticipants(messages, drawSession),
    [drawSession, messages],
  );
  const selectedToolLabel = INTERACTION_TOOLS.find((tool) => tool.value === selectedTool)?.label;

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
    setOpen(false);
  };

  const handleEndPoll = () => {
    setActivePoll((currentPoll) =>
      currentPoll ? { ...currentPoll, endedAt: new Date().toISOString() } : currentPoll,
    );
  };

  const handleStartDraw = () => {
    setDrawSession({
      endedAt: null,
      startedAt: new Date().toISOString(),
      winnerName: null,
    });
  };

  const handleEndDraw = () => {
    setDrawSession((currentSession) =>
      currentSession ? { ...currentSession, endedAt: new Date().toISOString() } : currentSession,
    );
  };

  const handlePickDrawWinner = () => {
    const winnerName = pickRandomItem(drawParticipants);

    if (!winnerName) return;

    setDrawSession((currentSession) =>
      currentSession ? { ...currentSession, winnerName } : currentSession,
    );
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
    setRouletteResult(pickRandomItem(rouletteItems));
  };

  return (
    <section className="border-border bg-muted/40 flex min-h-96 min-w-0 flex-col gap-4 rounded-xl border p-4 shadow-sm">
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
              <span className="bg-brand/10 text-brand flex size-12 items-center justify-center rounded-full">
                <Icon className="size-6" />
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
                <div className="text-muted-foreground bg-background flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold">
                  <BarChart3 className="size-4 shrink-0" />
                  <span>진행 중인 투표가 없습니다.</span>
                </div>
              )}

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger
                  render={
                    <Button
                      type="button"
                      className={cn(
                        "bg-brand hover:bg-brand/90 shadow-brand/20 h-10 rounded-xl text-sm font-bold text-white shadow-sm",
                        "active:scale-95",
                      )}
                    />
                  }
                >
                  <Plus className="size-4" />
                  투표 만들기
                </DialogTrigger>
                <DialogContent className="max-w-md gap-0 overflow-hidden rounded-2xl p-0 shadow-xl">
                  <DialogHeader className="bg-brand/5 border-brand/10 border-b px-5 pt-5 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="bg-brand/10 text-brand ring-brand/20 flex size-10 shrink-0 items-center justify-center rounded-xl ring-1">
                        <Vote className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <DialogTitle className="text-lg font-bold">투표 만들기</DialogTitle>
                        <DialogDescription className="mt-1 leading-relaxed">
                          방송 채팅 명령어로 집계할 투표를 시작합니다.
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>
                  <form onSubmit={handleCreatePoll} className="flex flex-col gap-5 px-5 py-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-muted-foreground text-xs font-semibold">
                        투표 제목
                      </label>
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
                        <label className="text-muted-foreground text-xs font-semibold">
                          선택지
                        </label>
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

                    <div className="flex gap-2.5">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 flex-1 rounded-xl font-semibold"
                        onClick={() => setOpen(false)}
                      >
                        취소
                      </Button>
                      <Button
                        type="submit"
                        disabled={!canCreatePoll}
                        className="bg-brand hover:bg-brand/90 h-10 flex-1 rounded-xl font-bold text-white"
                      >
                        투표 시작
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {selectedTool === "draw" && (
            <div className="flex flex-1 flex-col gap-3">
              <div className="bg-background border-border flex flex-col gap-3 rounded-xl border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="text-brand size-4" />
                    <span className="text-sm font-bold">참여자 {drawParticipants.length}명</span>
                  </div>
                  <span className="text-muted-foreground text-xs font-semibold">
                    {drawSession ? (drawSession.endedAt ? "모집 종료" : "모집 중") : "모집 대기"}
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

              {drawSession?.winnerName && (
                <div className="bg-brand/10 text-brand flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold">
                  <Trophy className="size-4" />
                  당첨자 {drawSession.winnerName}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl font-bold"
                  onClick={handleStartDraw}
                >
                  모집 시작
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl font-bold"
                  disabled={!drawSession || Boolean(drawSession.endedAt)}
                  onClick={handleEndDraw}
                >
                  모집 종료
                </Button>
                <Button
                  type="button"
                  className="bg-brand hover:bg-brand/90 h-10 rounded-xl font-bold text-white"
                  disabled={!drawSession || drawParticipants.length === 0}
                  onClick={handlePickDrawWinner}
                >
                  추첨
                </Button>
              </div>
            </div>
          )}

          {selectedTool === "roulette" && (
            <div className="flex flex-1 flex-col gap-3">
              <div className="bg-background border-border flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border px-3 py-4 text-center">
                <Sparkles className="text-brand size-5" />
                <strong className="text-lg">{rouletteResult ?? "룰렛 대기"}</strong>
                <span className="text-muted-foreground text-xs font-semibold">
                  항목을 추가하고 룰렛을 돌립니다.
                </span>
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
                disabled={rouletteItems.length === 0}
                onClick={handleSpinRoulette}
              >
                <RotateCw className="size-4" />
                룰렛 돌리기
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
