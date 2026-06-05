"use client";
// 후원 알림 볼륨을 조절하는 네이티브 range 슬라이더입니다.

import {
  DONATION_ALERT_VOLUME_MAX,
  DONATION_ALERT_VOLUME_MIN,
  DONATION_ALERT_VOLUME_STEP,
} from "@/constants/channel/donation";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export function DonationVolumeSlider({ value, disabled, onChange }: Props) {
  return (
    <div className="flex w-full items-center gap-3 sm:w-64">
      <input
        type="range"
        min={DONATION_ALERT_VOLUME_MIN}
        max={DONATION_ALERT_VOLUME_MAX}
        step={DONATION_ALERT_VOLUME_STEP}
        value={value}
        disabled={disabled}
        aria-label="알림 볼륨"
        onChange={(event) => onChange(Number(event.target.value))}
        className={cn(
          "bg-muted accent-brand h-1.5 w-full cursor-pointer appearance-none rounded-full",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      />
      <span className="text-foreground w-10 shrink-0 text-right text-sm font-bold tabular-nums">
        {value}%
      </span>
    </div>
  );
}
