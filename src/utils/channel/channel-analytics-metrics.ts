// 누적 시청자 샘플에서 분당 메시지·시청자/후원 추세(%)를 파생합니다.

import {
  ANALYTICS_MPM_WINDOW_MS,
  ANALYTICS_TREND_CLAMP,
  ANALYTICS_TREND_WINDOW_MS,
} from "@/constants/channel/analytics";
import type { AnalyticsSample } from "@/types/channel/analytics";

export function deriveMessageMetrics(samples: AnalyticsSample[]): {
  messagesPerMinute: number | null;
  messagesPerMinuteTrend: number | null;
} {
  if (samples.length < 2) {
    return { messagesPerMinute: null, messagesPerMinuteTrend: null };
  }

  const now = samples[samples.length - 1].at;
  const current = messageRateAt(samples, now);
  const past = messageRateAt(samples, now - ANALYTICS_TREND_WINDOW_MS);

  const messagesPerMinute = current === null ? null : Math.round(current);

  return {
    messagesPerMinute,
    messagesPerMinuteTrend: percentTrend(current, past),
  };
}

// 시청자 추이 추세(10분 전 동접 대비 % 변화).
export function deriveViewerTrend(samples: AnalyticsSample[]): number | null {
  return valueTrend(samples, (sample) => sample.viewers);
}

// 누적 후원 추세(10분 전 누적 대비 % 변화).
export function deriveDonationTrend(samples: AnalyticsSample[]): number | null {
  return valueTrend(samples, (sample) => sample.donationAmountTotal);
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
