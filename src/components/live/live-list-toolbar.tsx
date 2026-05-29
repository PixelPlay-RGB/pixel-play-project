// 라이브 목록의 정렬 컨트롤을 배치합니다.

import LiveSortMenu from "@/components/live/live-sort-menu";
import type { LiveListSort } from "@/types/live/live";

interface LiveListToolbarProps {
  sort: LiveListSort;
  onSortChange: (sort: LiveListSort) => void;
}

export default function LiveListToolbar({ sort, onSortChange }: LiveListToolbarProps) {
  return (
    <div className="flex min-w-0 justify-end">
      <LiveSortMenu sort={sort} onSortChange={onSortChange} />
    </div>
  );
}
