// 라이브 목록 필터 칩을 렌더링합니다.

import { LIVE_LIST_FILTER_ICON, LIVE_LIST_FILTER_OPTIONS } from "@/constants/live/live-list";
import { cn } from "@/lib/utils";
import type { LiveListFilter } from "@/types/live/live";

interface LiveFilterTabsProps {
  filter: LiveListFilter;
  isFollowingVisible: boolean;
  onFilterChange: (filter: LiveListFilter) => void;
}

export default function LiveFilterTabs({
  filter,
  isFollowingVisible,
  onFilterChange,
}: LiveFilterTabsProps) {
  const visibleOptions = LIVE_LIST_FILTER_OPTIONS.filter(
    (option) => option.value !== "FOLLOWING" || isFollowingVisible,
  );

  return (
    <div className="flex w-full max-w-full min-w-0 gap-2 overflow-x-auto pb-1">
      {visibleOptions.map((option) => {
        const isSelected = filter === option.value;
        const Icon = LIVE_LIST_FILTER_ICON[option.value];

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            title={option.description}
            onClick={() => onFilterChange(option.value)}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-bold transition-colors",
              "focus-visible:ring-ring outline-none focus-visible:ring-3",
              isSelected
                ? "bg-live border-live text-white"
                : "border-border bg-background/60 text-foreground hover:border-live/40 hover:text-live",
            )}
          >
            <Icon className="size-4" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
