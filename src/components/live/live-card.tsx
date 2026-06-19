// 라이브 목록의 개별 방송 카드를 렌더링합니다.

import Image from "next/image";
import Link from "next/link";

import CreatorAvatarPopover from "@/components/creator/creator-avatar-popover";
import LiveBadge from "@/components/live/live-badge";
import LiveTagLink from "@/components/live/live-tag-link";
import { cn } from "@/lib/utils";
import type { LiveListItem } from "@/types/live/live";
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
    // GAP-008: 오프스크린 카드의 레이아웃·페인트를 건너뛰어(브라우저 네이티브 렌더 가상화) 목록이
    // 길어져도 스크롤 비용을 낮춘다. JS 그리드 가상화와 달리 반응형 cols 레이아웃을 그대로 둔다.
    // contain-intrinsic-size: 첫 렌더 전 높이 추정값(렌더 후엔 auto가 실제 크기를 기억해 스크롤 안정).
    <article className="min-w-0 [contain-intrinsic-size:auto_320px] [content-visibility:auto]">
      <Link
        href={liveHref}
        className={cn(
          "group relative z-0 block aspect-video overflow-hidden rounded-lg bg-black outline-none",
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
          className="absolute top-3 right-3 inline-flex rounded-full bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur"
          aria-label={`${formatViewerCountLabel(item.currentViewerCount)} 시청 중`}
        >
          {formatViewerCountLabel(item.currentViewerCount)}
        </span>
      </Link>

      <div className="relative z-10 mt-3 flex gap-2.5">
        <CreatorAvatarPopover
          creatorId={item.creatorId}
          creatorNickname={item.creatorNickname}
          creatorPhotoUrl={item.creatorPhotoUrl}
          isFollowing={item.isFollowing}
          isLive
          avatarClassName="size-9"
          triggerClassName="mt-0.5"
        />

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
