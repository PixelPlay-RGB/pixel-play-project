// 시청자 추이 차트의 X축 시간 눈금 간격·눈금 배열을 계산합니다.
import type { AnalyticsRange } from "@/types/channel/analytics";

const MINUTE_MS = 60_000;

// "처음부터" 구간에서 약 6눈금이 되도록 고르는 분 단위 후보(작은 값부터).
const NICE_INTERVAL_MINUTES = [1, 2, 5, 10, 15, 30, 60, 120, 180, 360];

// 범위별 X축 눈금 간격(ms). 윈도우 범위는 고정, "처음부터"는 구간 길이에 맞춰 적응 선택한다.
export function resolveTickIntervalMs(range: AnalyticsRange, spanMs: number): number {
  if (range === "5m") {
    return MINUTE_MS; // 1분 간격(최대 약 5눈금)
  }

  if (range === "30m") {
    return 5 * MINUTE_MS; // 5분 간격(최대 약 6눈금)
  }

  // "all": 방송 진행 길이에 따라 ~6눈금이 되도록 가장 가까운 분 단위 간격을 고른다.
  const target = spanMs / 6;

  for (const minutes of NICE_INTERVAL_MINUTES) {
    if (minutes * MINUTE_MS >= target) {
      return minutes * MINUTE_MS;
    }
  }

  return 360 * MINUTE_MS;
}

// [minAt, maxAt] 안에서 간격 경계(정시 정렬)에 떨어지는 눈금들을 만든다.
export function buildTimeTicks(minAt: number, maxAt: number, intervalMs: number): number[] {
  // 샘플 1개(maxAt === minAt)면 그 시각 단일 눈금이 자연스럽다.
  // 다만 maxAt가 비유한값이면 [NaN] 눈금이 새어나가지 않도록 빈 눈금으로 떨어뜨린다.
  if (!Number.isFinite(minAt) || !Number.isFinite(maxAt) || maxAt <= minAt) {
    return Number.isFinite(maxAt) ? [maxAt] : [];
  }

  const ticks: number[] = [];

  for (let tick = Math.ceil(minAt / intervalMs) * intervalMs; tick <= maxAt; tick += intervalMs) {
    ticks.push(tick);
  }

  // 경계에 눈금이 하나도 안 걸리는 아주 짧은 구간은 양 끝이라도 표시한다.
  return ticks.length > 0 ? ticks : [minAt, maxAt];
}
