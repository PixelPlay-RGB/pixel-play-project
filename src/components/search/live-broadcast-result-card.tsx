// 라이브 방송 검색 결과 카드를 렌더링합니다.
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { LiveSearchResult } from "@/types/search/search";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";
import { Radio, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Props {
  result: LiveSearchResult;
}

const numberFormatter = new Intl.NumberFormat("ko-KR");

export default function LiveBroadcastResultCard({ result }: Props) {
  const avatarSrc = getAvatarImageSrc(result.creator_photo_url);
  const fallbackText = getAvatarFallbackText(result.creator_nickname, 1);

  return (
    <Link
      href={`/live/${result.creator_id}`}
      prefetch={false}
      className={cn(
        "group flex min-h-68 flex-col overflow-hidden rounded-2xl border text-left",
        "border-border/60 bg-card shadow-sm transition-all duration-200",
        "hover:border-live/40 hover:shadow-live/10 hover:-translate-y-0.5 hover:shadow-lg",
        "dark:border-border/40 dark:hover:border-live/30 dark:hover:bg-accent/40",
      )}
    >
      <div
        className={cn(
          "relative flex aspect-video min-h-40 items-center justify-center overflow-hidden",
          "bg-live/10 dark:bg-live/15",
        )}
      >
        {result.thumbnail_url ? (
          <Image
            src={result.thumbnail_url}
            alt={`${result.title ?? result.creator_nickname} 방송 썸네일`}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="bg-background/70 ring-live/20 flex h-14 w-14 items-center justify-center rounded-2xl ring-1">
              <Radio className="text-live h-7 w-7" />
            </div>
            <span className="text-muted-foreground text-xs font-bold">LIVE PREVIEW</span>
          </div>
        )}
        <div className="bg-live absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black text-white shadow-sm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          LIVE
        </div>
        <div className="bg-background/90 text-foreground absolute top-3 right-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm backdrop-blur">
          <Users className="text-live h-3 w-3" />
          {numberFormatter.format(result.current_viewer_count)}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex min-w-0 gap-3">
          <Avatar size="lg">
            <AvatarImage src={avatarSrc} alt={`${result.creator_nickname}의 프로필 사진`} />
            <AvatarFallback>{fallbackText}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="text-foreground line-clamp-2 text-sm leading-snug font-black">
              {result.title ?? "라이브 방송"}
            </h3>
            <p className="text-muted-foreground mt-1 truncate text-xs font-medium">
              {result.creator_nickname}
            </p>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap gap-1.5">
          {result.tags.slice(0, 3).map((tag) => (
            <span
              key={`${result.broadcast_id}-${tag}`}
              className="bg-live/10 text-live dark:bg-live/15 rounded-full px-2 py-0.5 text-xs font-bold"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
