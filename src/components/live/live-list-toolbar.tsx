// 라이브 목록의 필터와 정렬 컨트롤을 배치합니다.

import LiveFilterTabs from "@/components/live/live-filter-tabs";
import LiveSortMenu from "@/components/live/live-sort-menu";
import type { LiveListFilter, LiveListSort } from "@/types/live/live";

interface LiveListToolbarProps {
  filter: LiveListFilter;
  sort: LiveListSort;
  isFollowingVisible: boolean;
  onFilterChange: (filter: LiveListFilter) => void;
  onSortChange: (sort: LiveListSort) => void;
}

export default function LiveListToolbar({
  filter,
  sort,
  isFollowingVisible,
  onFilterChange,
  onSortChange,
}: LiveListToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <LiveFilterTabs
        filter={filter}
        isFollowingVisible={isFollowingVisible}
        onFilterChange={onFilterChange}
      />
      <LiveSortMenu sort={sort} onSortChange={onSortChange} />
    </div>
  );
}
