// 클립 기간 필터(전체/24시간/7일/30일) 세그먼트 컨트롤 — bg-muted 트랙 위에서
// 활성 항목만 떠오르는(bg-background+shadow) iOS풍 토글. 단순 chip보다 묶음이 또렷하다.

import { cn } from "@/lib/utils";

interface ClipPillOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: Array<ClipPillOption<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

export function ClipPillGroup<T extends string>({ options, value, onChange, ariaLabel }: Props<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="bg-muted/70 inline-flex shrink-0 items-center gap-0.5 rounded-full p-0.5"
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "focus-visible:ring-ring inline-flex h-7 shrink-0 cursor-pointer items-center rounded-full px-3 text-xs font-bold transition-all outline-none focus-visible:ring-2",
              isActive
                ? "bg-background text-foreground shadow-sm"
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
