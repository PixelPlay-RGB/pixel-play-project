// 누적 시청자 샘플에서 분당 메시지·시청자/후원 추세(%)를 파생합니다.

import {
  ANALYTICS_DONATION_PACE_WINDOW_MS,
  ANALYTICS_MPM_WINDOW_MS,
  ANALYTICS_TREND_CLAMP,
  ANALYTICS_TREND_WINDOW_MS,
} from "@/constants/channel/analytics";
import type { AnalyticsLogEvent, AnalyticsSample, TopSupporter } from "@/types/channel/analytics";

export function deriveMessageMetrics(samples: AnalyticsSample[]): {
  messagesPerMinute: number | null;
} {
  if (samples.length < 2) {
    return { messagesPerMinute: null };
  }

  const now = samples[samples.length - 1].at;
  const current = messageRateAt(samples, now);

  return { messagesPerMinute: current === null ? null : Math.round(current) };
}

// 시청자 추이 추세(10분 전 동접 대비 % 변화).
export function deriveViewerTrend(samples: AnalyticsSample[]): number | null {
  return valueTrend(samples, (sample) => sample.viewers);
}

// 누적 후원 추세(10분 전 누적 대비 % 변화).
export function deriveDonationTrend(samples: AnalyticsSample[]): number | null {
  return valueTrend(samples, (sample) => sample.donationAmountTotal);
}

// 방송 시작 이후 동접 평균(샘플 viewers 평균). 모멘텀 카드 보조 지표.
export function deriveAverageViewers(samples: AnalyticsSample[]): number {
  if (samples.length === 0) {
    return 0;
  }

  const total = samples.reduce((sum, sample) => sum + sample.viewers, 0);

  return Math.round(total / samples.length);
}

// 현재 동접이 최고 대비 몇 % 위치인지(0~−100). peak가 0이면 판단 불가라 null.
export function derivePeakRatio(current: number, peak: number): number | null {
  if (peak <= 0) {
    return null;
  }

  const ratio = Math.round(((current - peak) / peak) * 100);

  // current는 peak 이하라 0~−100 범위. 방어적으로 클램프한다.
  return Math.max(-100, Math.min(0, ratio));
}

// 채팅 참여율(고유 참여자 ÷ 현재 시청자, %). 시청자 0이면 null. 회전율로 100% 초과 가능해 상한 고정.
export function deriveChatParticipationRate(
  uniqueChatters: number,
  viewers: number,
): number | null {
  if (viewers <= 0) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round((uniqueChatters / viewers) * 100)));
}

// 최근 윈도우 후원 금액 증가량을 분당(P/분)으로 환산한다(messagesPerMinute와 같은 누적 델타 방식).
export function deriveDonationPace(samples: AnalyticsSample[]): number | null {
  if (samples.length < 2) {
    return null;
  }

  const now = samples[samples.length - 1].at;
  const head = lastSampleAtOrBefore(samples, now);
  const base = lastSampleAtOrBefore(samples, now - ANALYTICS_DONATION_PACE_WINDOW_MS);

  if (!head || !base || head.at <= base.at) {
    return null;
  }

  const minutes = (head.at - base.at) / 60_000;

  if (minutes <= 0) {
    return null;
  }

  return Math.max(0, Math.round((head.donationAmountTotal - base.donationAmountTotal) / minutes));
}

// 이번 방송 최다 후원자: donorName 단위로 금액을 합산해 최댓값을 고른다(donor_id는 노출 안 함).
export function deriveTopSupporter(events: AnalyticsLogEvent[]): TopSupporter | null {
  const totals = new Map<string, number>();

  for (const event of events) {
    if (event.type !== "donation" || !event.actorName || !event.amount) {
      continue;
    }

    totals.set(event.actorName, (totals.get(event.actorName) ?? 0) + event.amount);
  }

  let top: TopSupporter | null = null;

  for (const [name, amount] of totals) {
    if (!top || amount > top.amount) {
      top = { name, amount };
    }
  }

  return top;
}

function valueTrend(
  samples: AnalyticsSample[],
  pick: (sample: AnalyticsSample) => number,
): number | null {
  if (samples.length < 2) {
    return null;
  }

  const now = samples[samples.length - 1].at;
  const head = lastSampleAtOrBefore(samples, now);
  const base = lastSampleAtOrBefore(samples, now - ANALYTICS_TREND_WINDOW_MS);

  if (!head || !base || head.at <= base.at) {
    return null;
  }

  return percentTrend(pick(head), pick(base));
}

// 비정상 스파이크를 막기 위해 ±ANALYTICS_TREND_CLAMP로 클램프한다.
function percentTrend(current: number | null, past: number | null): number | null {
  if (current === null || past === null || past === 0) {
    return null;
  }

  const trend = Math.round(((current - past) / past) * 100);

  return Math.max(-ANALYTICS_TREND_CLAMP, Math.min(ANALYTICS_TREND_CLAMP, trend));
}

// anchorAt 직전 1분간 chat_message_count 증가량을 분당 값으로 환산한다.
function messageRateAt(samples: AnalyticsSample[], anchorAt: number): number | null {
  const head = lastSampleAtOrBefore(samples, anchorAt);
  const base = lastSampleAtOrBefore(samples, anchorAt - ANALYTICS_MPM_WINDOW_MS);

  if (!head || !base || head.at <= base.at) {
    return null;
  }

  const minutes = (head.at - base.at) / 60_000;

  if (minutes <= 0) {
    return null;
  }

  return Math.max(0, (head.chatCount - base.chatCount) / minutes);
}

// 샘플은 시간 오름차순으로 누적되므로 anchor 이하 마지막 샘플을 선형 탐색한다.
function lastSampleAtOrBefore(samples: AnalyticsSample[], at: number): AnalyticsSample | null {
  let found: AnalyticsSample | null = null;

  for (const sample of samples) {
    if (sample.at <= at) {
      found = sample;
    } else {
      break;
    }
  }

  return found;
}
