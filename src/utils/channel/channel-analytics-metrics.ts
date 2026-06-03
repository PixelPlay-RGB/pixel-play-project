// 누적 시청자 샘플에서 분당 메시지와 추세(%)를 파생합니다.

import { ANALYTICS_MPM_WINDOW_MS, ANALYTICS_TREND_WINDOW_MS } from "@/constants/channel/analytics";
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
  const messagesPerMinuteTrend =
    current === null || past === null || past === 0
      ? null
      : Math.round(((current - past) / past) * 100);

  return { messagesPerMinute, messagesPerMinuteTrend };
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
