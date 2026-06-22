// 라이브 목록의 빈 상태 문구를 렌더링합니다.

import { Radio } from "lucide-react";

import { LIVE_LIST_EMPTY_MESSAGE } from "@/constants/live/live-list";
import type { LiveListFilter } from "@/types/live/live";

interface LiveListEmptyStateProps {
  filter: LiveListFilter;
}

export default function LiveListEmptyState({ filter }: LiveListEmptyStateProps) {
  const message = LIVE_LIST_EMPTY_MESSAGE[filter];

  return (
    <div className="flex min-h-72 flex-1 flex-col items-center justify-center px-5 py-12 text-center">
      <span className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-lg">
        <Radio className="size-6" />
      </span>
      <h2 className="text-foreground mt-4 text-lg font-bold">{message.title}</h2>
      <p className="text-muted-foreground mt-2 max-w-90 text-sm leading-relaxed">
        {message.description}
      </p>
    </div>
  );
}
