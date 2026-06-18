// 라이브 투표/추첨/룰렛 팝오버의 현재 상호작용 선택과 집계 계산을 담당하는 순수 함수를 제공합니다.
import { LIVE_LABEL, LIVE_VOTE_LABEL } from "@/constants/live/live";
import type { LiveInteractionNotice, LivePoll, LivePollOption } from "@/types/live/live";

export type CurrentInteraction =
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

export function selectCurrentInteraction(
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

export function getVotePercent(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function getMaxCount(options: LivePollOption[]): number {
  return options.reduce((max, option) => Math.max(max, option.count), 0);
}

export function getTriggerLabel(currentInteraction: CurrentInteraction) {
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

export function shouldPromptLoginOnOpen(currentInteraction: CurrentInteraction) {
  return currentInteraction.type === "poll" && currentInteraction.mode === "active";
}
