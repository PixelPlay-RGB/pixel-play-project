"use client";
// 시청자 추이 차트의 시간 범위를 선택합니다.

import { Button } from "@/components/ui/button";
import { ANALYTICS_LABEL, ANALYTICS_RANGE_OPTIONS } from "@/constants/channel/analytics";
import type { AnalyticsRange } from "@/types/channel/analytics";

interface Props {
  value: AnalyticsRange;
  onChange: (range: AnalyticsRange) => void;
}

export function AnalyticsRangeSelector({ value, onChange }: Props) {
  return (
    <div className="flex gap-1">
      {ANALYTICS_RANGE_OPTIONS.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={value === option.value ? "default" : "ghost"}
          onClick={() => onChange(option.value)}
        >
          {ANALYTICS_LABEL[option.labelKey]}
        </Button>
      ))}
    </div>
  );
}
