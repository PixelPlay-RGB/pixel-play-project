// 방송 운영 상호작용 도구(투표·추첨·룰렛)의 집계·기하 계산 순수 함수를 제공합니다.
import { ROULETTE_POINTER_DEGREE, ROULETTE_SPIN_TURNS } from "@/constants/channel/live-interaction";
import type {
  ChannelLiveDrawParticipant,
  PollResult,
  RouletteItem,
  RouletteSegment,
} from "@/types/channel/live-interaction";
import type { LivePoll } from "@/types/live/live";

export function getPollResults(poll: LivePoll | null) {
  if (!poll) {
    return [];
  }

  return poll.options.map<PollResult>((option) => ({
    count: option.count,
    option: option.label,
    percent: poll.totalCount > 0 ? Math.round((option.count / poll.totalCount) * 100) : 0,
  }));
}

export function toDrawParticipantNames(participants: ChannelLiveDrawParticipant[]) {
  return participants.map((participant) => participant.nickname);
}

export function pickRandomItem<T>(items: T[]) {
  if (items.length === 0) {
    return null;
  }

  return items[Math.floor(Math.random() * items.length)];
}

export function getRouletteItemLabelStyle(centerDegree: number) {
  return {
    transform: `translate(-50%, -50%) rotate(${centerDegree}deg) translateY(-82px) rotate(${-centerDegree}deg)`,
  };
}

function normalizeRouletteDegree(degree: number) {
  return ((degree % 360) + 360) % 360;
}

export function getRouletteItemPercent(itemCount: number) {
  if (itemCount <= 0) {
    return "0%";
  }

  const percent = 100 / itemCount;

  return `${percent.toFixed(percent % 1 === 0 ? 0 : 2)}%`;
}

export function getValidRouletteItems(items: RouletteItem[]) {
  return items
    .map((item) => ({
      label: item.label.trim(),
    }))
    .filter((item) => item.label.length > 0);
}

export function getRouletteSegments(items: RouletteItem[]) {
  if (items.length === 0) {
    return [];
  }

  const itemPercent = 100 / items.length;
  let currentPercent = 0;

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

export function pickRouletteSegment(segments: RouletteSegment[]) {
  if (segments.length === 0) {
    return null;
  }

  return segments[Math.floor(Math.random() * segments.length)] ?? null;
}

export function getRouletteTargetRotation(currentRotation: number, targetDegree: number) {
  const targetRotation = normalizeRouletteDegree(ROULETTE_POINTER_DEGREE - targetDegree);
  const minRotation = currentRotation + ROULETTE_SPIN_TURNS * 360;
  let nextRotation = Math.floor(minRotation / 360) * 360 + targetRotation;

  while (nextRotation < minRotation) {
    nextRotation += 360;
  }

  return nextRotation;
}

export function getRouletteTargetDegree(segment: RouletteSegment) {
  const segmentDegree = ((segment.endPercent - segment.startPercent) / 100) * 360;
  const safeOffsetLimit = Math.max(segmentDegree * 0.34, 0);

  if (safeOffsetLimit <= 0) {
    return segment.centerDegree;
  }

  const offsetDirection = Math.random() < 0.5 ? -1 : 1;
  const offsetAmount = safeOffsetLimit * (0.28 + Math.random() * 0.52);

  return segment.centerDegree + offsetDirection * offsetAmount;
}
