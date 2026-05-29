// 라이브 탐색 화면의 데스크톱 사이드 레일을 렌더링합니다.

import { Clock3, Heart, MessageCircle, Radio } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LIVE_LIST_FILTER_OPTIONS } from "@/constants/live/live-list";
import { cn } from "@/lib/utils";
import type { LiveListFilter, LiveListItem } from "@/types/live/live";
import { formatViewerCount } from "@/utils/live/live-list";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";

interface LiveSideRailProps {
  filter: LiveListFilter;
  items: LiveListItem[];
  isFollowingVisible: boolean;
  onFilterChange: (filter: LiveListFilter) => void;
}

export default function LiveSideRail({
  filter,
  items,
  isFollowingVisible,
  onFilterChange,
}: LiveSideRailProps) {
  const visibleFilters = LIVE_LIST_FILTER_OPTIONS.filter(
    (option) => option.value !== "FOLLOWING" || isFollowingVisible,
  );
  const spotlightItems = items.slice(0, 5);

  return (
    <aside className="hidden w-52 shrink-0 lg:block">
      <div className="border-border/70 sticky top-19 flex flex-col gap-6 border-r pr-4">
        <nav className="space-y-1" aria-label="라이브 탐색">
          <p className="text-muted-foreground px-3 text-xs font-bold">탐색</p>
          {visibleFilters.map((option) => {
            const isSelected = filter === option.value;
            const Icon =
              option.value === "ALL"
                ? Radio
                : option.value === "FOLLOWING"
                  ? Heart
                  : option.value === "RECENT"
                    ? Clock3
                    : MessageCircle;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onFilterChange(option.value)}
                className={cn(
                  "flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm font-bold transition",
                  "focus-visible:ring-ring outline-none focus-visible:ring-3",
                  isSelected
                    ? "bg-brand/15 text-brand"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {option.label}
              </button>
            );
          })}
        </nav>

        {spotlightItems.length > 0 ? (
          <section className="space-y-3">
            <p className="text-muted-foreground px-3 text-xs font-bold">지금 뜨는 채널</p>
            <div className="space-y-2">
              {spotlightItems.map((item) => (
                <div key={item.id} className="flex min-w-0 items-center gap-2 px-3">
                  <Avatar className="size-7" size="sm">
                    <AvatarImage
                      src={getAvatarImageSrc(item.creatorPhotoUrl)}
                      alt={`${item.creatorNickname} 프로필 이미지`}
                    />
                    <AvatarFallback>
                      {getAvatarFallbackText(item.creatorNickname, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-xs font-bold">
                      {item.creatorNickname}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {formatViewerCount(item.currentViewerCount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </aside>
  );
}
