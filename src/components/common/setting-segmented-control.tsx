"use client";
// 설정 화면에서 숫자 옵션을 세그먼트 버튼으로 선택하는 컨트롤입니다.

import { cn } from "@/lib/utils";

interface NumberOption {
  value: number;
  label: string;
}

interface Props {
  value: number;
  options: ReadonlyArray<NumberOption>;
  ariaLabel: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export function SettingSegmentedControl({ value, options, ariaLabel, disabled, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="bg-muted inline-flex items-center gap-1 rounded-full p-1"
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
              "disabled:pointer-events-none disabled:opacity-50",
              isActive
                ? "bg-brand text-brand-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
