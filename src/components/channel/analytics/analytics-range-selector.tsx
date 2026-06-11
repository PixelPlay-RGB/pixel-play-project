"use client";
// 시청자 추이 차트의 시간 범위를 선택합니다.

import { SegmentedButtonGroup } from "@/components/channel/analytics/segmented-button-group";
import { ANALYTICS_LABEL, ANALYTICS_RANGE_OPTIONS } from "@/constants/channel/analytics";
import type { AnalyticsRange } from "@/types/channel/analytics";

interface Props {
  value: AnalyticsRange;
  onChange: (range: AnalyticsRange) => void;
}

export function AnalyticsRangeSelector({ value, onChange }: Props) {
  return (
    <SegmentedButtonGroup
      ariaLabel={ANALYTICS_LABEL.rangeAriaLabel}
      options={ANALYTICS_RANGE_OPTIONS.map((option) => ({
        value: option.value,
        label: ANALYTICS_LABEL[option.labelKey],
      }))}
      value={value}
      onSelect={onChange}
    />
  );
}
