"use client";
// 지난 방송 분석의 조회 기간(7일/30일/전체)을 URL searchParams로 전환합니다.

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SegmentedButtonGroup } from "@/components/channel/analytics/segmented-button-group";
import {
  ANALYTICS_LABEL,
  REPORT_PERIOD_DEFAULT,
  REPORT_PERIOD_OPTIONS,
} from "@/constants/channel/analytics";
import type { BroadcastReportPeriod } from "@/types/channel/analytics";

interface Props {
  value: BroadcastReportPeriod;
}

export function ReportPeriodSelector({ value }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(period: BroadcastReportPeriod) {
    const params = new URLSearchParams(searchParams);

    // 기간을 바꾸면 목록이 달라지므로 페이지를 1로 되돌린다.
    params.delete("page");

    // 기본값(전체)은 파라미터를 비워 URL을 깔끔하게 유지한다.
    if (period === REPORT_PERIOD_DEFAULT) {
      params.delete("period");
    } else {
      params.set("period", period);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <SegmentedButtonGroup
      ariaLabel={ANALYTICS_LABEL.reportPeriodAriaLabel}
      options={REPORT_PERIOD_OPTIONS.map((option) => ({
        value: option.value,
        label: ANALYTICS_LABEL[option.labelKey],
      }))}
      value={value}
      onSelect={handleChange}
    />
  );
}
