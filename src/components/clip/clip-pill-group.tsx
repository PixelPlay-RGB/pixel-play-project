// 클립 목록의 정렬·기간 선택 pill 그룹 — 모바일 라이브 필터 chip과 같은 결의 작은 토글.

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
    <div role="group" aria-label={ariaLabel} className="flex shrink-0 items-center gap-1.5">
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "border-border bg-card text-muted-foreground inline-flex h-8 shrink-0 cursor-pointer items-center rounded-full border px-3 text-xs font-bold transition-colors",
              "hover:border-brand/40 hover:text-brand focus-visible:ring-ring outline-none focus-visible:ring-3",
              isActive && "bg-brand text-brand-foreground border-brand hover:text-brand-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
