// 랜딩 프리뷰 스크롤 애니메이션 계산 함수를 제공합니다.
import type { ScrollRange } from "@/types/preview/landing-preview";

export function mapScrollValue(
  value: number,
  range: ScrollRange,
  outputStart: number,
  outputEnd: number,
) {
  if (range.end <= range.start) {
    return outputStart;
  }

  const progress = Math.min(1, Math.max(0, (value - range.start) / (range.end - range.start)));

  return outputStart + (outputEnd - outputStart) * progress;
}

export function mapScrollPeakValue(
  value: number,
  range: ScrollRange,
  outputStart: number,
  outputMiddle: number,
  outputEnd: number,
) {
  if (range.end <= range.start) {
    return outputStart;
  }

  const progress = Math.min(1, Math.max(0, (value - range.start) / (range.end - range.start)));

  if (progress <= 0.5) {
    return outputStart + (outputMiddle - outputStart) * (progress / 0.5);
  }

  return outputMiddle + (outputEnd - outputMiddle) * ((progress - 0.5) / 0.5);
}
