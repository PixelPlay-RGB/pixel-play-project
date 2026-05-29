// 라이브 목록 필터 칩을 렌더링합니다.

import type { LucideIcon } from "lucide-react";
import { Heart, MessageCircle, Radio, Sparkles } from "lucide-react";

import { LIVE_LIST_FILTER_OPTIONS } from "@/constants/live/live-list";
import { cn } from "@/lib/utils";
import type { LiveListFilter } from "@/types/live/live";

const FILTER_ICON: Record<LiveListFilter, LucideIcon> = {
  ALL: Radio,
  FOLLOWING: Heart,
  RECENT: Sparkles,
  ACTIVE_CHAT: MessageCircle,
};

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
    <div className="flex gap-2 overflow-x-auto pb-1">
      {visibleOptions.map((option) => {
        const isSelected = filter === option.value;
        const Icon = FILTER_ICON[option.value];

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            title={option.description}
            onClick={() => onFilterChange(option.value)}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold transition-colors",
              "focus-visible:ring-ring outline-none focus-visible:ring-3",
              isSelected
                ? "bg-foreground text-background border-foreground"
                : "border-border bg-card text-foreground hover:bg-muted",
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
