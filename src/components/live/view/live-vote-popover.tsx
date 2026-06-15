"use client";
// 투표 참여와 라이브 상호작용 결과를 채팅 패널 액션 팝오버로 제공합니다.

import { useId, useMemo, useRef, useState, type RefObject } from "react";
import { Check, Crown, FerrisWheel, Sparkles, Trophy, X } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ROULETTE_SEGMENT_COLORS,
  ROULETTE_SPIN_DURATION_SECONDS,
} from "@/constants/channel/live-interaction";
import { LIVE_LABEL, LIVE_VOTE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";
import { getRouletteItemLabelStyle, getRouletteSegments } from "@/utils/channel/live-interaction";
import { formatCount } from "@/utils/live/live-chat";
import type { LiveInteractionNotice, LivePoll, LivePollOption } from "@/types/live/live";

// 후원(코랄 채움) 옆에 나란히 놓이는 투표 트리거는 브랜드 민트 아웃라인으로 역할을 구분한다.
// h-8: 입력 섹션을 낮게 유지하기 위한 슬림 높이(비디오 하단 라인 정렬용).
const VOTE_TRIGGER_CLASS = cn(
  "h-8 flex-1 text-sm",
  "border-brand/30 bg-brand/10 text-brand",
  "hover:border-brand/50 hover:bg-brand/18 dark:border-brand/30 dark:bg-brand/15 dark:text-brand",
);

interface Props {
  interactionNotices?: LiveInteractionNotice[];
  isError?: boolean;
  isInteractionNoticesError?: boolean;
  isInteractionNoticesLoading?: boolean;
  isLoading?: boolean;
  isLoggedIn: boolean;
  onLoginPrompt: () => void;
  onJoinDraw?: (drawNoticeId: string) => Promise<boolean>;
  onVote: (pollId: string, optionId: string) => Promise<boolean>;
  polls: LivePoll[];
  presentation?: "popover" | "dialog";
  // 팝오버를 채팅 입력칸 위로 띄워 입력칸을 가리지 않게 한다(규칙·팔로우 popover와 동일 anchor).
  anchorRef?: RefObject<HTMLElement | null>;
  // 방송 종료 등으로 투표 참여를 막을 때 트리거를 비활성화한다.
  disabled?: boolean;
  // 전체화면 오버레이 등에서 popover/dialog 포털 컨테이너를 전체화면 요소로 지정한다(미지정=body).
  portalContainer?: HTMLElement | null;
}

type CurrentInteraction =
  | { type: "empty" }
  | { createdAt: string; mode: "active" | "result"; poll: LivePoll; type: "poll" }
  | {
      createdAt: string;
      mode: "active" | "result";
      notice: LiveInteractionNotice;
      type: "draw" | "roulette";
    };

function getCreatedTime(value: string): number {
  const time = new Date(value).getTime();

  return Number.isFinite(time) ? time : 0;
}

function selectLatestByCreatedAt<T extends { createdAt: string }>(items: T[]): T | null {
  return items.reduce<T | null>((latestItem, item) => {
    if (!latestItem) return item;

    return getCreatedTime(item.createdAt) > getCreatedTime(latestItem.createdAt)
      ? item
      : latestItem;
  }, null);
}

function selectCurrentInteraction(
  polls: LivePoll[],
  notices: LiveInteractionNotice[],
): CurrentInteraction {
  const latestActivePoll = selectLatestByCreatedAt(
    polls.filter((poll) => poll.status === "active"),
  );
  const latestNoticeByType = {
    draw: selectLatestByCreatedAt(notices.filter((notice) => notice.type === "draw")),
    roulette: selectLatestByCreatedAt(notices.filter((notice) => notice.type === "roulette")),
  };
  const latestActiveNotice = selectLatestByCreatedAt(
    [latestNoticeByType.draw, latestNoticeByType.roulette].flatMap((notice) =>
      notice?.status === "active" ? [notice] : [],
    ),
  );
  const latestActiveInteraction = selectLatestByCreatedAt(
    [
      latestActivePoll
        ? {
            createdAt: latestActivePoll.createdAt,
            mode: "active" as const,
            poll: latestActivePoll,
            type: "poll" as const,
          }
        : null,
      latestActiveNotice
        ? {
            createdAt: latestActiveNotice.createdAt,
            mode: "active" as const,
            notice: latestActiveNotice,
            type: latestActiveNotice.type,
          }
        : null,
    ].flatMap((interaction) => (interaction ? [interaction] : [])),
  );

  if (latestActiveInteraction) {
    return latestActiveInteraction;
  }

  const latestEndedPollInteraction = selectLatestByCreatedAt(
    polls
      .filter((poll) => poll.status === "ended")
      .map((poll) => ({
        createdAt: poll.endedAt ?? poll.createdAt,
        mode: "result" as const,
        poll,
        type: "poll" as const,
      })),
  );
  const latestEndedNotice = selectLatestByCreatedAt(
    [latestNoticeByType.draw, latestNoticeByType.roulette].flatMap((notice) =>
      notice?.status === "ended" ? [notice] : [],
    ),
  );
  const latestResultInteraction = selectLatestByCreatedAt(
    [
      latestEndedPollInteraction,
      latestEndedNotice
        ? {
            createdAt: latestEndedNotice.createdAt,
            mode: "result" as const,
            notice: latestEndedNotice,
            type: latestEndedNotice.type,
          }
        : null,
    ].flatMap((interaction) => (interaction ? [interaction] : [])),
  );

  return latestResultInteraction ?? { type: "empty" };
}

function getVotePercent(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 100);
}

function getMaxCount(options: LivePollOption[]): number {
  return options.reduce((max, option) => Math.max(max, option.count), 0);
}

function StatusPill({ children, tone }: { children: string; tone: "brand" | "live" | "muted" }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
        tone === "brand" && "bg-brand/10 text-brand",
        tone === "live" && "bg-live/10 text-live",
        tone === "muted" && "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

function InteractionHeader({
  onClose,
  status,
  title,
  titleId,
  tone,
}: {
  onClose: () => void;
  status: string;
  title: string;
  titleId?: string;
  tone: "brand" | "live" | "muted";
}) {
  return (
    <div className="flex items-center justify-between gap-3 pb-3">
      <p id={titleId} className="text-foreground min-w-0 flex-1 text-sm font-bold">
        {title}
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <StatusPill tone={tone}>{status}</StatusPill>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground size-7"
          onClick={onClose}
        >
          <X className="size-4" />
          <span className="sr-only">{LIVE_LABEL.close}</span>
        </Button>
      </div>
    </div>
  );
}

function getVoteOptionClass(isSelected: boolean) {
  return cn(
    "border-border relative flex h-9 w-full items-center justify-start overflow-hidden rounded-md border px-3 text-sm font-bold transition-all",
    isSelected
      ? "border-brand bg-brand/10 text-brand shadow-[inset_0_0_0_1px_var(--brand)]"
      : "hover:border-brand/40",
  );
}

function VoteOptionBar({ percent, emphasized }: { emphasized: boolean; percent: number }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute inset-y-0 left-0 transition-all duration-300",
        emphasized ? "bg-brand/20" : "bg-muted",
      )}
      style={{ width: `${percent}%` }}
    />
  );
}

function StandbyCard() {
  return (
    <div className="border-border flex flex-col gap-3 rounded-lg border p-3">
      <StatusPill tone="brand">상시 버튼</StatusPill>
      <div className="flex flex-col gap-1">
        <p className="text-foreground text-sm font-bold">{LIVE_VOTE_LABEL.emptyTitle}</p>
        <p className="text-muted-foreground text-xs leading-relaxed">{LIVE_VOTE_LABEL.emptyDesc}</p>
      </div>
      <Button type="button" variant="outline" disabled className="h-9 w-full">
        {LIVE_VOTE_LABEL.waiting}
      </Button>
    </div>
  );
}

function ActiveVoteCard({
  activePoll,
  onVote,
  onClose,
}: {
  activePoll: LivePoll;
  onClose: () => void;
  onVote: (pollId: string, optionId: string) => Promise<boolean>;
}) {
  const titleId = useId();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const total = activePoll.totalCount;
  const canSubmit = !!selectedOption && !isVoting;

  async function handleVote() {
    if (!selectedOption || isVoting) return;

    setIsVoting(true);
    await onVote(activePoll.id, selectedOption);
    setIsVoting(false);
  }

  return (
    <div className="flex flex-col overflow-hidden">
      <InteractionHeader
        title="투표"
        titleId={titleId}
        status={LIVE_VOTE_LABEL.active}
        tone="brand"
        onClose={onClose}
      />
      <div
        role="radiogroup"
        aria-labelledby={titleId}
        className="border-border flex flex-col gap-2 border-t border-dashed py-3"
      >
        {activePoll.options.map((option, index) => {
          const isSelected = selectedOption === option.id;
          const percent = getVotePercent(option.count, total);

          return (
            <Button
              key={option.id}
              type="button"
              role="radio"
              variant="outline"
              aria-checked={isSelected}
              disabled={isVoting}
              onClick={() => setSelectedOption(option.id)}
              className={getVoteOptionClass(isSelected)}
            >
              <VoteOptionBar percent={percent} emphasized={isSelected} />
              <span className="relative flex min-w-0 flex-1 items-center gap-2">
                <span className="bg-brand/10 text-brand flex size-5 shrink-0 items-center justify-center rounded-full text-xs">
                  {index + 1}
                </span>
                <span className="truncate">{option.label}</span>
              </span>
              {isSelected ? <Check className="relative size-4 shrink-0" /> : null}
            </Button>
          );
        })}
      </div>
      <div className="border-border flex items-center justify-between gap-3 border-t border-dashed pt-3">
        <span className="text-muted-foreground text-xs font-semibold tabular-nums">
          {formatCount(total)}
          {LIVE_VOTE_LABEL.liveParticipantsSuffix}
        </span>
        <Button
          type="button"
          disabled={!canSubmit}
          onClick={() => void handleVote()}
          className="bg-brand hover:bg-brand/90 text-brand-foreground h-9 px-4 text-xs font-bold"
        >
          {isVoting ? LIVE_VOTE_LABEL.submitting : LIVE_VOTE_LABEL.confirmVote}
        </Button>
      </div>
    </div>
  );
}

function ParticipatedCard({ onClose, poll }: { onClose: () => void; poll: LivePoll }) {
  const total = poll.totalCount;

  return (
    <div className="flex flex-col overflow-hidden">
      <InteractionHeader
        title="투표"
        status={LIVE_VOTE_LABEL.active}
        tone="brand"
        onClose={onClose}
      />
      <div className="border-border flex flex-col gap-2 border-t border-dashed py-3">
        {poll.options.map((option, index) => {
          const isSelected = option.id === poll.userVotedOptionId;
          const percent = getVotePercent(option.count, total);

          return (
            <div key={option.id} className={getVoteOptionClass(isSelected)}>
              <VoteOptionBar percent={percent} emphasized={isSelected} />
              <span className="relative flex min-w-0 flex-1 items-center gap-2">
                <span className="bg-brand/10 text-brand flex size-5 shrink-0 items-center justify-center rounded-full text-xs">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {isSelected ? `${option.label}${LIVE_VOTE_LABEL.selectedSuffix}` : option.label}
                </span>
              </span>
              {isSelected ? <Check className="size-4 shrink-0" /> : null}
            </div>
          );
        })}
      </div>
      <div className="border-border flex items-center justify-between gap-3 border-t border-dashed pt-3">
        <span className="text-muted-foreground text-xs font-semibold tabular-nums">
          {formatCount(total)}
          {LIVE_VOTE_LABEL.liveParticipantsSuffix}
        </span>
        <Button
          type="button"
          disabled
          className="bg-brand/80 text-brand-foreground h-9 px-4 text-xs font-bold"
        >
          {LIVE_VOTE_LABEL.participated}
        </Button>
      </div>
    </div>
  );
}

function VoteResults({ poll, onClose }: { onClose: () => void; poll: LivePoll }) {
  const total = poll.totalCount;
  const maxCount = getMaxCount(poll.options);

  return (
    <div className="flex flex-col overflow-hidden">
      <InteractionHeader
        title="투표"
        status={LIVE_VOTE_LABEL.ended}
        tone="muted"
        onClose={onClose}
      />
      <div className="border-border flex flex-col gap-2 border-t border-dashed py-3">
        {poll.options.map((option) => {
          const percent = getVotePercent(option.count, total);
          const isWinner = option.count > 0 && option.count === maxCount;

          return (
            <div key={option.id} className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-2">
              <div
                className={cn(
                  "flex min-w-0 items-center gap-1 text-sm font-black",
                  isWinner ? "text-brand" : "text-foreground",
                )}
              >
                {isWinner ? <Crown aria-hidden className="size-4 shrink-0" /> : null}
                <span className="truncate">{option.label}</span>
              </div>
              <div className="bg-muted relative h-10 overflow-hidden rounded-xl">
                <div
                  className="bg-brand absolute inset-y-0 left-0 rounded-xl transition-all"
                  style={{ width: `${percent}%` }}
                />
                <span className="text-foreground relative z-10 flex h-full items-center justify-end px-3 text-xs font-black tabular-nums">
                  {formatCount(option.count)}
                  {LIVE_VOTE_LABEL.votesUnit} · {percent}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-border flex items-center justify-between border-t border-dashed pt-3 text-xs font-bold">
        <span>{LIVE_VOTE_LABEL.totalPrefix}</span>
        <span>
          {formatCount(total)}
          {LIVE_VOTE_LABEL.participantsUnit}
        </span>
      </div>
    </div>
  );
}

function DrawNoticeBoard({
  hasJoined,
  notice,
}: {
  hasJoined: boolean;
  notice: LiveInteractionNotice;
}) {
  const winnerNames = notice.winnerNames ?? [];
  const participantNames = notice.participantNames ?? [];
  const participantCount = participantNames.length || notice.participantCount || 0;

  return (
    <div className="border-border border-t border-dashed py-3">
      <div className="flex flex-col gap-3">
        <div className="border-border bg-background/60 flex min-h-32 flex-col rounded-lg border p-3">
          <div className="border-border flex items-center justify-between gap-2 border-b pb-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-brand text-xs font-black">
                {LIVE_VOTE_LABEL.drawCandidatesTitle}
              </span>
              {hasJoined ? (
                <span className="bg-brand/10 text-brand rounded-full px-2 py-0.5 text-[11px] font-black">
                  {LIVE_VOTE_LABEL.drawCandidateJoined}
                </span>
              ) : null}
            </div>
            <span className="text-foreground shrink-0 text-xs font-black">
              총 {formatCount(participantCount)}명
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pt-3">
            {participantNames.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {participantNames.map((participantName, index) => (
                  <span
                    key={`${participantName}-${index}`}
                    className="bg-brand/10 text-brand rounded-lg px-2 py-1 text-xs font-black"
                  >
                    {participantName}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex h-full min-h-18 items-center justify-center text-center">
                <p className="text-muted-foreground text-xs font-bold">
                  {LIVE_VOTE_LABEL.drawCandidateWaiting}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="border-border bg-background/60 flex min-h-32 flex-col rounded-lg border p-3">
          <div className="border-border flex items-center justify-between gap-2 border-b pb-2">
            <span className="text-live text-xs font-black">{LIVE_VOTE_LABEL.drawWinnerTitle}</span>
            <span className="text-foreground text-xs font-black">
              {formatCount(winnerNames.length)}명
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pt-2">
            {winnerNames.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {winnerNames.map((winnerName, index) => (
                  <span
                    key={`${winnerName}-${index}`}
                    className="bg-live/10 text-live rounded-lg px-2 py-1 text-xs font-black"
                  >
                    {index + 1}. {winnerName}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex h-full min-h-16 items-center justify-center text-center">
                <p className="text-muted-foreground text-xs font-bold">
                  {LIVE_VOTE_LABEL.drawNoWinner}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RouletteNoticeBoard({ notice }: { notice: LiveInteractionNotice }) {
  const rouletteItems = useMemo(
    () => (notice.rouletteItems ?? []).map((label) => ({ label })),
    [notice.rouletteItems],
  );
  const rouletteSegments = useMemo(() => getRouletteSegments(rouletteItems), [rouletteItems]);
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
  const rotationKeyframes = notice.rouletteRotationKeyframes?.length
    ? notice.rouletteRotationKeyframes
    : [0];
  const isActive = notice.status === "active";
  const rouletteEase = ["easeOut" as const, "linear" as const, "easeOut" as const];
  const rouletteTransition =
    isActive && rotationKeyframes.length > 1
      ? {
          duration: notice.rouletteDurationSeconds ?? ROULETTE_SPIN_DURATION_SECONDS,
          ease: rouletteEase,
          times: [0, 0.14, 0.58, 1],
        }
      : { duration: 0 };

  return (
    <div className="border-border flex flex-col items-center gap-4 border-t border-dashed py-3">
      <div className="relative flex size-56 items-center justify-center">
        <div className="absolute top-5 right-8 z-20 rotate-[225deg] drop-shadow-lg">
          <div
            className="bg-border h-8 w-4"
            style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }}
          />
          <div
            className="bg-destructive absolute top-0.5 left-0.5 h-7 w-3"
            style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }}
          />
        </div>
        <motion.div
          className="border-background relative size-52 overflow-hidden rounded-full border-8 shadow-lg"
          style={rouletteSegmentStyle}
          animate={{ rotate: rotationKeyframes }}
          transition={rouletteTransition}
        >
          {rouletteSegments.map((segment) => (
            <span
              key={`${segment.item.label}-${segment.index}-viewer-wheel`}
              className="absolute top-1/2 left-1/2 w-16 truncate text-center text-[11px] font-black text-white drop-shadow"
              style={getRouletteItemLabelStyle(segment.centerDegree)}
            >
              {segment.item.label}
            </span>
          ))}
        </motion.div>
        <div className="bg-background border-border absolute flex size-16 flex-col items-center justify-center rounded-full border shadow-sm">
          <FerrisWheel className="text-brand size-5" />
          <span className="text-muted-foreground text-[10px] font-bold">ROULETTE</span>
        </div>
      </div>
      <strong className="text-foreground text-center text-base font-black wrap-break-word">
        {isActive ? LIVE_VOTE_LABEL.rouletteActiveTitle : notice.resultLabel}
      </strong>
    </div>
  );
}

function InteractionNoticeCard({
  isLoggedIn,
  notice,
  onClose,
  onJoinDraw,
  onLoginPrompt,
}: {
  isLoggedIn: boolean;
  notice: LiveInteractionNotice;
  onClose: () => void;
  onJoinDraw?: (drawNoticeId: string) => Promise<boolean>;
  onLoginPrompt: () => void;
}) {
  const isActive = notice.status === "active";
  const [joinedDrawNoticeId, setJoinedDrawNoticeId] = useState<string | null>(null);
  const [isJoiningDraw, setIsJoiningDraw] = useState(false);
  const isDraw = notice.type === "draw";
  const Icon = notice.type === "draw" ? Trophy : FerrisWheel;
  const title = isDraw ? "추첨" : "룰렛";
  const status = isActive ? LIVE_VOTE_LABEL.active : LIVE_VOTE_LABEL.ended;
  const detail = notice.winnerNames?.join(", ") ?? notice.resultLabel ?? notice.content;
  const canJoinDraw = isActive && notice.type === "draw";
  const hasJoined = Boolean(notice.hasJoined) || joinedDrawNoticeId === notice.id;

  async function handleJoinDraw() {
    if (!canJoinDraw) {
      onClose();
      return;
    }

    if (!isLoggedIn) {
      onClose();
      onLoginPrompt();
      return;
    }

    if (!onJoinDraw || hasJoined || isJoiningDraw) return;

    setIsJoiningDraw(true);
    const success = await onJoinDraw(notice.id);
    setIsJoiningDraw(false);

    if (success) {
      setJoinedDrawNoticeId(notice.id);
    }
  }

  return (
    <div className="flex flex-col overflow-hidden">
      <InteractionHeader
        title={title}
        status={status}
        tone={isActive ? "brand" : "muted"}
        onClose={onClose}
      />
      {!isDraw ? (
        <>
          {notice.type === "roulette" && notice.rouletteItems ? (
            <RouletteNoticeBoard notice={notice} />
          ) : (
            <div className="border-border border-t border-dashed py-3">
              <div className="flex items-center gap-2 pb-3">
                <span className="bg-brand/10 text-brand flex size-9 shrink-0 items-center justify-center rounded-full">
                  <Icon className="size-5" />
                </span>
                <p className="text-foreground min-w-0 text-sm font-bold wrap-break-word">
                  {detail}
                </p>
              </div>
              {notice.participantCount !== undefined ? (
                <p className="text-muted-foreground mt-1 text-xs">
                  {formatCount(notice.participantCount)}
                  {LIVE_VOTE_LABEL.participantsUnit}
                </p>
              ) : null}
            </div>
          )}
        </>
      ) : (
        <DrawNoticeBoard hasJoined={hasJoined} notice={notice} />
      )}
      {isDraw ? (
        <div className="border-border border-t border-dashed pt-3">
          <Button
            type="button"
            variant={isActive ? "default" : "outline"}
            disabled={
              (isActive && !canJoinDraw) ||
              (canJoinDraw && isLoggedIn && (hasJoined || isJoiningDraw || !onJoinDraw))
            }
            className={cn(
              isActive && "bg-live/80 text-live-foreground",
              "h-9 w-full text-xs font-bold",
            )}
            onClick={() => void handleJoinDraw()}
          >
            {canJoinDraw
              ? isJoiningDraw
                ? LIVE_VOTE_LABEL.submitting
                : hasJoined
                  ? LIVE_VOTE_LABEL.participated
                  : LIVE_VOTE_LABEL.submit
              : isActive
                ? LIVE_VOTE_LABEL.active
                : LIVE_LABEL.close}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function VoteBody({
  currentInteraction,
  isError,
  isInteractionNoticesError,
  isInteractionNoticesLoading,
  isLoading,
  isLoggedIn,
  onClose,
  onJoinDraw,
  onLoginPrompt,
  onVote,
}: {
  currentInteraction: CurrentInteraction;
  isError?: boolean;
  isInteractionNoticesError?: boolean;
  isInteractionNoticesLoading?: boolean;
  isLoading?: boolean;
  isLoggedIn: boolean;
  onClose: () => void;
  onJoinDraw?: (drawNoticeId: string) => Promise<boolean>;
  onLoginPrompt: () => void;
  onVote: (pollId: string, optionId: string) => Promise<boolean>;
}) {
  if (currentInteraction.type === "empty" && (isLoading || isInteractionNoticesLoading)) {
    return <p className="text-muted-foreground text-sm">{LIVE_VOTE_LABEL.loading}</p>;
  }

  if (currentInteraction.type === "empty" && (isError || isInteractionNoticesError)) {
    return <p className="text-muted-foreground text-sm">{LIVE_VOTE_LABEL.error}</p>;
  }

  if (currentInteraction.type === "empty") {
    return <StandbyCard />;
  }

  if (currentInteraction.type === "draw" || currentInteraction.type === "roulette") {
    return (
      <InteractionNoticeCard
        isLoggedIn={isLoggedIn}
        notice={currentInteraction.notice}
        onClose={onClose}
        onJoinDraw={onJoinDraw}
        onLoginPrompt={onLoginPrompt}
      />
    );
  }

  if (currentInteraction.type !== "poll") {
    return null;
  }

  const pollInteraction = currentInteraction;

  if (pollInteraction.mode === "result") {
    return <VoteResults poll={pollInteraction.poll} onClose={onClose} />;
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col overflow-hidden">
        <InteractionHeader
          title="투표"
          status={LIVE_VOTE_LABEL.active}
          tone="brand"
          onClose={onClose}
        />
        <p className="border-border text-muted-foreground border-t border-dashed py-3 text-sm">
          {LIVE_LABEL.loginDescription}
        </p>
        <div className="border-border border-t border-dashed pt-3">
          <Button
            type="button"
            onClick={() => {
              onClose();
              onLoginPrompt();
            }}
            className="bg-brand hover:bg-brand/90 text-brand-foreground h-9 w-full"
          >
            {LIVE_LABEL.loginButton}
          </Button>
        </div>
      </div>
    );
  }

  return pollInteraction.poll.userVotedOptionId ? (
    <ParticipatedCard poll={pollInteraction.poll} onClose={onClose} />
  ) : (
    <ActiveVoteCard activePoll={pollInteraction.poll} onVote={onVote} onClose={onClose} />
  );
}

function getTriggerLabel(currentInteraction: CurrentInteraction) {
  if (currentInteraction.type === "poll") {
    return currentInteraction.mode === "active" ? LIVE_LABEL.vote : LIVE_VOTE_LABEL.resultTitle;
  }

  if (currentInteraction.type === "draw") {
    return currentInteraction.mode === "active"
      ? LIVE_VOTE_LABEL.drawCheck
      : LIVE_VOTE_LABEL.drawResult;
  }

  if (currentInteraction.type === "roulette") {
    return currentInteraction.mode === "active"
      ? LIVE_VOTE_LABEL.rouletteCheck
      : LIVE_VOTE_LABEL.rouletteResult;
  }

  return LIVE_VOTE_LABEL.interactionTitle;
}

function shouldPromptLoginOnOpen(currentInteraction: CurrentInteraction) {
  return currentInteraction.type === "poll" && currentInteraction.mode === "active";
}

export function LiveVotePopover({
  interactionNotices = [],
  isError,
  isInteractionNoticesError,
  isInteractionNoticesLoading,
  isLoading,
  isLoggedIn,
  onJoinDraw,
  onLoginPrompt,
  onVote,
  polls,
  presentation = "popover",
  anchorRef,
  disabled = false,
  portalContainer,
}: Props) {
  const [open, setOpen] = useState(false);
  const autoOpenedRouletteNoticeIdRef = useRef<string | null>(null);

  // 열어둔 채 방송이 종료되면(disabled 전환) 즉시 닫는다.
  // effect 내 setState는 lint 에러(set-state-in-effect)라 렌더 중 가드된 setState 패턴을 쓴다.
  if (disabled && open) {
    setOpen(false);
  }

  const currentInteraction = selectCurrentInteraction(polls, interactionNotices);
  // 진행 중·종료 기록이 모두 없으면 열어도 보여줄 것이 없으므로 트리거를 비활성화한다.
  const hasInteraction = currentInteraction.type !== "empty";
  const triggerLabel = getTriggerLabel(currentInteraction);

  if (
    !disabled &&
    currentInteraction.type === "roulette" &&
    currentInteraction.mode === "active" &&
    autoOpenedRouletteNoticeIdRef.current !== currentInteraction.notice.id &&
    !open
  ) {
    autoOpenedRouletteNoticeIdRef.current = currentInteraction.notice.id;
    setOpen(true);
  }

  function handleOpenChange(next: boolean) {
    if (next && !isLoggedIn && shouldPromptLoginOnOpen(currentInteraction)) {
      onLoginPrompt();
      return;
    }

    setOpen(next);
  }

  function handleOpen() {
    handleOpenChange(true);
  }

  const body = (
    <VoteBody
      currentInteraction={currentInteraction}
      isLoading={isLoading}
      isError={isError}
      isInteractionNoticesLoading={isInteractionNoticesLoading}
      isInteractionNoticesError={isInteractionNoticesError}
      isLoggedIn={isLoggedIn}
      onJoinDraw={onJoinDraw}
      onLoginPrompt={onLoginPrompt}
      onVote={onVote}
      onClose={() => setOpen(false)}
    />
  );

  if (presentation === "dialog") {
    return (
      <>
        <Button
          size="sm"
          variant="outline"
          className={VOTE_TRIGGER_CLASS}
          disabled={disabled || !hasInteraction}
          title={!hasInteraction ? LIVE_VOTE_LABEL.emptyInteraction : undefined}
          onClick={handleOpen}
        >
          <Sparkles className="size-4" />
          {triggerLabel}
        </Button>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent
            container={portalContainer}
            className="max-h-[calc(100vh-1rem)] gap-4 overflow-y-auto"
            showCloseButton={false}
          >
            {body}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            className={VOTE_TRIGGER_CLASS}
            disabled={disabled || !hasInteraction}
            title={!hasInteraction ? LIVE_VOTE_LABEL.emptyInteraction : undefined}
          />
        }
      >
        <Sparkles className="size-4" />
        {triggerLabel}
      </PopoverTrigger>
      <PopoverContent
        anchor={anchorRef ? () => anchorRef.current : undefined}
        container={portalContainer}
        align="center"
        side="top"
        sideOffset={0}
        // 기본 collisionPadding(5px)이 popover를 패널 밖으로 밀어내므로 0으로 고정해 패널 안에 둔다.
        collisionPadding={0}
        // 입력바(anchor) 풀폭 + 하단 직각으로 입력 섹션과 한 덩어리처럼 이어 붙인다(후원 popover와 동일).
        className="max-h-[calc(100vh-1rem)] w-(--anchor-width) overflow-y-auto rounded-b-none"
      >
        {body}
      </PopoverContent>
    </Popover>
  );
}
