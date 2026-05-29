// 라이브 방송 검색 결과 카드를 렌더링합니다.
import LiveSearchTagLink from "@/components/search/live-search-tag-link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { LiveSearchResult } from "@/types/search/search";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";
import { getLiveSearchTagLabels } from "@/utils/search/live-search";
import { Radio, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Props {
  result: LiveSearchResult;
}

const numberFormatter = new Intl.NumberFormat("ko-KR");

function getFallbackTone(creatorId: string) {
  const lastCharCode = creatorId.charCodeAt(creatorId.length - 1);

  if (lastCharCode % 3 === 0) {
    return "from-live/45 via-slate-900 to-slate-950 dark:from-live/55";
  }

  if (lastCharCode % 3 === 1) {
    return "from-slate-800 via-live/35 to-slate-950 dark:via-live/45";
  }

  return "from-live/35 via-slate-900 to-brand/25 dark:from-live/45 dark:to-brand/20";
}

function formatLiveDuration(startedAt: string | null) {
  if (!startedAt) {
    return "방송 중";
  }

  const startedTime = new Date(startedAt).getTime();
  const diffMinutes = Math.max(1, Math.floor((Date.now() - startedTime) / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}분째 방송 중`;
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  return minutes > 0 ? `${hours}시간 ${minutes}분째 방송 중` : `${hours}시간째 방송 중`;
}

export default function LiveBroadcastResultCard({ result }: Props) {
  const avatarSrc = getAvatarImageSrc(result.creator_photo_url);
  const fallbackText = getAvatarFallbackText(result.creator_nickname, 1);
  const liveDuration = formatLiveDuration(result.started_at);
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
          "bg-slate-950 text-white",
          "focus-visible:ring-ring outline-none focus-visible:ring-3",
        )}
        aria-label={`${result.title ?? result.creator_nickname} 라이브 보기`}
      >
        {result.thumbnail_url ? (
          <Image
            src={result.thumbnail_url}
            alt={`${result.title ?? result.creator_nickname} 방송 썸네일`}
            fill
            sizes="(min-width: 1024px) 160px, 128px"
            className={cn(
              "object-cover transition-transform duration-300",
              "group-hover/thumbnail:scale-105",
            )}
          />
        ) : (
          <>
            <div
              className={cn("absolute inset-0 bg-linear-to-br", getFallbackTone(result.creator_id))}
            />
            <div className="absolute inset-0 bg-white/5" />
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 h-14",
                "bg-linear-to-t from-black/70 to-transparent",
              )}
            />
            <div className={cn("relative flex flex-col items-center", "gap-2 text-center")}>
              <div
                className={cn(
                  "flex size-11 items-center justify-center rounded-xl border",
                  "border-white/10 bg-black/35 shadow-lg shadow-black/20 backdrop-blur",
                )}
              >
                <Radio className="text-live size-5" />
              </div>
              <span className={cn("text-xs font-black", "tracking-wider text-white/80")}>
                LIVE SIGNAL
              </span>
            </div>
          </>
        )}
        <span
          className={cn(
            "bg-live absolute top-2 left-2 inline-flex items-center gap-1.5",
            "rounded-md px-2 py-0.5 text-xs font-black text-white shadow-sm",
          )}
        >
          <span className={cn("h-1.5 w-1.5 animate-pulse", "rounded-full bg-white")} />
          LIVE
        </span>
        <span
          className={cn(
            "absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-md",
            "bg-black/65 px-2 py-0.5 text-xs font-bold text-white shadow-sm backdrop-blur",
          )}
        >
          <Users className="text-live size-3" />
          {numberFormatter.format(result.current_viewer_count)}
        </span>
      </Link>

      <div className={cn("flex min-w-0 flex-col justify-between", "gap-2.5 p-3.5")}>
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm leading-snug font-black">
            <Link
              href={`/live/${result.creator_id}`}
              prefetch={false}
              className={cn(
                "text-foreground transition-colors",
                "hover:text-live focus-visible:ring-ring rounded-sm outline-none focus-visible:ring-3",
              )}
            >
              {result.title ?? "라이브 방송"}
            </Link>
          </h3>
          <div className="mt-2 flex min-w-0 items-center gap-2">
            <Avatar className="size-5">
              <AvatarImage src={avatarSrc} alt={`${result.creator_nickname}의 프로필 사진`} />
              <AvatarFallback className="text-xs">{fallbackText}</AvatarFallback>
            </Avatar>
            <p className={cn("text-muted-foreground min-w-0 truncate", "text-xs font-medium")}>
              {result.creator_nickname}
            </p>
            <span className={cn("bg-muted-foreground/45 size-0.75", "shrink-0 rounded-full")} />
            <span className={cn("text-muted-foreground shrink-0", "text-xs font-medium")}>
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
