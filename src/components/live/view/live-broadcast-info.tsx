// 방송 제목, 태그를 표시합니다.

import type { LiveBroadcast } from "@/types/live/live";

interface Props {
  broadcast: LiveBroadcast;
}

export function LiveBroadcastInfo({ broadcast }: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <h1 className="text-foreground truncate text-base leading-snug font-semibold sm:text-lg">
        {broadcast.title}
      </h1>
      {broadcast.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {broadcast.tags.map((tag) => (
            <span key={tag} className="text-muted-foreground text-xs">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
