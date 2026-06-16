// 클립 기간 필터(전체/24시간/7일/30일) 세그먼트 컨트롤 — 앱 공용 Tabs 결과 동일하게
// bg-muted 트랙 + 브랜드 채움(active)으로 맞춘다. 모든 칸은 grid로 동일 너비를 갖는다.

import type { CSSProperties } from "react";

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
      // 동일 너비 칸: grid + 옵션 수만큼 1fr. 트랙 radius(rounded-lg) 안에 칸 radius(rounded-md)를 중첩.
      className="bg-muted grid w-full shrink-0 items-center gap-0.5 rounded-lg p-0.5 sm:w-auto"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` } as CSSProperties}
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
              "focus-visible:ring-ring inline-flex h-7 w-full shrink-0 cursor-pointer items-center justify-center rounded-md px-2 text-xs font-bold whitespace-nowrap transition-all outline-none focus-visible:ring-2 sm:px-4",
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
