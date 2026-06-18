// 라이브 방송 검색 결과 카드를 렌더링합니다.
import LiveSearchTagLink from "@/components/search/live-search-tag-link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { LiveSearchResult } from "@/types/search/search";
import { formatNumber } from "@/utils/common/format";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";
import { getLiveThumbnailSrc } from "@/utils/live/live-list";
import { getLiveSearchTagLabels } from "@/utils/search/live-search";
import { Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Props {
  result: LiveSearchResult;
}

// 경과 시간을 Date.now()로 한 번 계산하면 멈춘 시계처럼 보여, 라이브 여부만 단순 표기한다.
const LIVE_DURATION_LABEL = "방송 중";

export default function LiveBroadcastResultCard({ result }: Props) {
  const avatarSrc = getAvatarImageSrc(result.creator_photo_url);
  const fallbackText = getAvatarFallbackText(result.creator_nickname, 1);
  const liveDuration = LIVE_DURATION_LABEL;
  const tagLabels = getLiveSearchTagLabels(result.tags);

  return (
    <article
      className={cn(
        "flex min-h-30 flex-col overflow-hidden rounded-xl border text-left sm:flex-row",
        "border-border/70 bg-card shadow-sm transition-all duration-200 active:translate-y-px",
        "hover:border-live/45 hover:shadow-live/10 hover:shadow-md",
        "dark:border-border/40 dark:bg-card/90 dark:hover:border-live/35 dark:hover:bg-accent/25 dark:hover:shadow-live/10",
      )}
    >
      <Link
        href={`/live/${result.creator_id}`}
        prefetch={false}
        className={cn(
          "group/thumbnail relative flex min-h-34 items-center justify-center overflow-hidden sm:min-h-32",
          "sm:w-44 sm:shrink-0",
          "bg-black text-white",
          "focus-visible:ring-ring outline-none focus-visible:ring-3",
        )}
        aria-label={`${result.title ?? result.creator_nickname} 라이브 보기`}
      >
        <Image
          src={getLiveThumbnailSrc(result.broadcast_id ?? result.creator_id, result.thumbnail_url)}
          alt={`${result.title ?? result.creator_nickname} 방송 썸네일`}
          fill
          sizes="(min-width: 1024px) 160px, 128px"
          className="object-cover transition-transform duration-300 group-hover/thumbnail:scale-105"
        />
        <span className="bg-live text-live-foreground absolute top-2 left-2 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-black shadow-sm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          LIVE
        </span>
        <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-md bg-black/65 px-2 py-0.5 text-xs font-bold text-white shadow-sm backdrop-blur">
          <Users className="text-live size-3" />
          {formatNumber(result.current_viewer_count)}
        </span>
      </Link>

      <div className="flex min-w-0 flex-col justify-between gap-2.5 p-3.5">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm leading-snug font-black">
            <Link
              href={`/live/${result.creator_id}`}
              prefetch={false}
              className="text-foreground hover:text-live focus-visible:ring-ring rounded-sm transition-colors outline-none focus-visible:ring-3"
            >
              {result.title ?? "라이브 방송"}
            </Link>
          </h3>
          <div className="mt-2 flex min-w-0 items-center gap-2">
            <Avatar className="size-5">
              <AvatarImage src={avatarSrc} alt={`${result.creator_nickname}의 프로필 사진`} />
              <AvatarFallback className="text-xs">{fallbackText}</AvatarFallback>
            </Avatar>
            <p className="text-muted-foreground min-w-0 truncate text-xs font-medium">
              {result.creator_nickname}
            </p>
            <span className="bg-muted-foreground/45 size-0.75 shrink-0 rounded-full" />
            <span className="text-muted-foreground shrink-0 text-xs font-medium">
              {liveDuration}
            </span>
          </div>
        </div>

        {tagLabels.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {tagLabels.map((tag) => (
              <LiveSearchTagLink key={`${result.broadcast_id}-${tag}`} tag={tag} />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
