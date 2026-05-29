// 라이브 목록의 개별 방송 카드를 렌더링합니다.

import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LiveBadge from "@/components/live/live-badge";
import { cn } from "@/lib/utils";
import type { LiveListItem } from "@/types/live/live";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";
import {
  formatLiveDuration,
  formatRecentChatCount,
  formatViewerCount,
  getLiveTagLabels,
  getLiveThumbnailSrc,
} from "@/utils/live/live-list";

interface LiveCardProps {
  item: LiveListItem;
}

export default function LiveCard({ item }: LiveCardProps) {
  const tagLabels = getLiveTagLabels(item.tags);

  return (
    <Link
      href={`/live/${item.creatorId}`}
      className={cn(
        "group block min-w-0 outline-none",
        "focus-visible:ring-ring rounded-lg focus-visible:ring-3",
      )}
      aria-label={`${item.title} 라이브 보기`}
    >
      <div className="border-border/70 relative aspect-video overflow-hidden rounded-lg border bg-black">
        <Image
          src={getLiveThumbnailSrc(item.id, item.thumbnailUrl)}
          alt={`${item.title} 라이브 썸네일`}
          fill
          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 28vw, (min-width: 640px) 45vw, 92vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/55 to-transparent" />
        <LiveBadge className="absolute top-3 left-3" />
        <span
          className="absolute top-3 right-3 hidden rounded-full bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur sm:inline-flex"
          aria-label={formatViewerCount(item.currentViewerCount)}
        >
          {formatViewerCount(item.currentViewerCount)}
        </span>
      </div>

      <div className="mt-3 flex gap-2.5">
        <Avatar className="mt-0.5 size-9" size="lg">
          <AvatarImage
            src={getAvatarImageSrc(item.creatorPhotoUrl)}
            alt={`${item.creatorNickname} 프로필 이미지`}
          />
          <AvatarFallback>{getAvatarFallbackText(item.creatorNickname)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="min-w-0 space-y-1">
            <h3 className="text-foreground group-hover:text-brand line-clamp-2 text-sm leading-snug font-bold wrap-break-word">
              {item.title}
            </h3>
            <p className="text-muted-foreground truncate text-xs font-medium">
              {item.creatorNickname}
            </p>
          </div>

          <div className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs">
            <span>{formatLiveDuration(item.startedAt)}</span>
            <span aria-hidden="true">·</span>
            <span>{formatViewerCount(item.currentViewerCount)}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="size-3.5" />
              {formatRecentChatCount(item.recentChatCount)}
            </span>
          </div>

          {tagLabels.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {tagLabels.map((tag) => (
                <span
                  key={tag}
                  className="bg-muted/70 text-muted-foreground rounded-full px-2 py-0.5 text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
