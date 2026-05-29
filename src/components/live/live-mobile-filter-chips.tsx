"use client";
// 모바일 라이브 목록 필터 chip을 렌더링합니다.

import { Spinner } from "@/components/ui/spinner";
import { LIVE_LIST_FILTER_ICON, LIVE_LIST_FILTER_OPTIONS } from "@/constants/live/live-list";
import { cn } from "@/lib/utils";
import type { LiveListFilter } from "@/types/live/live";

interface LiveMobileFilterChipsProps {
  activeFilter: LiveListFilter;
  isFollowingVisible: boolean;
  isFetching: boolean;
  onFilterChange: (filter: LiveListFilter) => void;
}

export default function LiveMobileFilterChips({
  activeFilter,
  isFollowingVisible,
  isFetching,
  onFilterChange,
}: LiveMobileFilterChipsProps) {
  const filterItems = LIVE_LIST_FILTER_OPTIONS.filter(
    (item) => item.value !== "FOLLOWING" || isFollowingVisible,
  );

  return (
    <nav className="md:hidden" aria-label="라이브 필터">
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {filterItems.map((item) => {
          const Icon = LIVE_LIST_FILTER_ICON[item.value];
          const isActive = item.value === activeFilter;

          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onFilterChange(item.value)}
              className={cn(
                "border-border bg-card text-muted-foreground inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-xs font-bold transition-colors",
                "hover:border-live/40 hover:text-live focus-visible:ring-ring outline-none focus-visible:ring-3",
                isActive && "bg-live text-live-foreground border-live hover:text-live-foreground",
              )}
            >
              <Icon className="size-3.5" />
              <span>{item.label}</span>
              {isActive && isFetching ? <Spinner className="size-3.5" /> : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
