// 라이브 목록의 개별 방송 카드를 렌더링합니다.

import Image from "next/image";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LiveBadge from "@/components/live/live-badge";
import LiveTagLink from "@/components/live/live-tag-link";
import { cn } from "@/lib/utils";
import type { LiveListItem } from "@/types/live/live";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";
import {
  formatViewerCountLabel,
  getLiveTagLabels,
  getLiveThumbnailSrc,
} from "@/utils/live/live-list";

interface LiveCardProps {
  item: LiveListItem;
}

export default function LiveCard({ item }: LiveCardProps) {
  const tagLabels = getLiveTagLabels(item.tags);
  const liveHref = `/live/${item.creatorId}`;

  return (
    <article className="group min-w-0">
      <Link
        href={liveHref}
        className={cn(
          "relative z-0 block aspect-video overflow-hidden rounded-lg bg-black outline-none",
          "focus-visible:ring-ring focus-visible:ring-3",
        )}
        aria-label={`${item.title} 라이브 보기`}
      >
        <Image
          src={getLiveThumbnailSrc(item.id, item.thumbnailUrl)}
          alt={`${item.title} 라이브 썸네일`}
          fill
          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 28vw, (min-width: 640px) 45vw, 92vw"
          className="object-cover transition duration-300 group-hover:scale-105 group-hover:opacity-60"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/55 to-transparent" />
        <LiveBadge className="absolute top-3 left-3" />
        <span
          className="absolute top-3 right-3 hidden rounded-full bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur sm:inline-flex"
          aria-label={`${formatViewerCountLabel(item.currentViewerCount)} 시청 중`}
        >
          {formatViewerCountLabel(item.currentViewerCount)}
        </span>
      </Link>

      <div className="relative z-10 mt-3 flex gap-2.5">
        <Link
          href={liveHref}
          className="focus-visible:ring-ring mt-0.5 shrink-0 rounded-full outline-none focus-visible:ring-3"
          aria-label={`${item.creatorNickname} 채널로 이동`}
        >
          <Avatar className="size-9" size="lg">
            <AvatarImage
              src={getAvatarImageSrc(item.creatorPhotoUrl)}
              alt={`${item.creatorNickname} 프로필 이미지`}
            />
            <AvatarFallback>{getAvatarFallbackText(item.creatorNickname)}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="min-w-0 space-y-1">
            <h3 className="line-clamp-2 text-sm leading-snug font-bold wrap-break-word">
              <Link
                href={liveHref}
                className="text-foreground focus-visible:ring-ring rounded-sm outline-none focus-visible:ring-3"
              >
                {item.title}
              </Link>
            </h3>
            <p className="text-muted-foreground truncate text-xs font-medium">
              {item.creatorNickname}
            </p>
          </div>

          {tagLabels.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {tagLabels.map((tag) => (
                <LiveTagLink key={tag} tag={tag} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
