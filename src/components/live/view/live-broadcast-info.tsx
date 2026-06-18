// 방송 제목, 태그를 표시합니다.

import LiveTagLink from "@/components/live/live-tag-link";
import type { LiveBroadcast } from "@/types/live/live";

interface Props {
  broadcast: LiveBroadcast;
}

export function LiveBroadcastInfo({ broadcast }: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <h1
        className="text-foreground line-clamp-2 text-base leading-snug font-semibold wrap-break-word sm:text-lg"
        title={broadcast.title}
      >
        {broadcast.title}
      </h1>
      {broadcast.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {broadcast.tags.map((tag) => (
            <LiveTagLink key={tag} tag={tag} />
          ))}
        </div>
      )}
    </div>
  );
}
