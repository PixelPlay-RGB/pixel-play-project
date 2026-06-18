// 라이브 추첨/룰렛 공지 카드(후보·당첨 보드, 룰렛 휠, 참여 액션)를 제공합니다.
import { useMemo, useState } from "react";
import { FerrisWheel, Trophy } from "lucide-react";
import { motion } from "motion/react";

import { InteractionHeader } from "@/components/live/view/live-vote-shared";
import { Button } from "@/components/ui/button";
import {
  ROULETTE_SEGMENT_COLORS,
  ROULETTE_SPIN_DURATION_SECONDS,
} from "@/constants/channel/live-interaction";
import { LIVE_LABEL, LIVE_VOTE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";
import { getRouletteItemLabelStyle, getRouletteSegments } from "@/utils/channel/live-interaction";
import { formatCount } from "@/utils/live/live-chat";
import type { LiveInteractionNotice } from "@/types/live/live";

export function DrawNoticeBoard({
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

export function RouletteNoticeBoard({ notice }: { notice: LiveInteractionNotice }) {
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

export function InteractionNoticeCard({
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
