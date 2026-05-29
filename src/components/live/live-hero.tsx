// 라이브 목록 상단의 대표 방송 Hero를 렌더링합니다.

import Image from "next/image";
import Link from "next/link";
import { Play, Radio } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LiveBadge from "@/components/live/live-badge";
import { cn } from "@/lib/utils";
import type { LiveHeroItem } from "@/types/live/live";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";
import {
  formatLiveDuration,
  formatViewerCount,
  getLiveTagLabels,
  getLiveThumbnailSrc,
} from "@/utils/live/live-list";

interface LiveHeroProps {
  hero: LiveHeroItem | null;
}

export default function LiveHero({ hero }: LiveHeroProps) {
  if (!hero) {
    return (
      <section className="border-border bg-card flex min-h-52 flex-col justify-between rounded-lg border p-5 md:min-h-64 md:p-6">
        <div className="flex items-center gap-2">
          <span className="bg-live/10 text-live flex size-10 items-center justify-center rounded-lg">
            <Radio className="size-5" />
          </span>
          <LiveBadge />
        </div>
        <div className="max-w-120 space-y-2">
          <h1 className="text-foreground text-2xl font-bold md:text-4xl">
            지금은 방송을 찾고 있어요.
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
            새 라이브가 시작되면 가장 먼저 이곳에 보여드릴게요.
          </p>
        </div>
      </section>
    );
  }

  const tagLabels = getLiveTagLabels(hero.tags, 3);

  return (
    <Link
      href={`/live/${hero.creatorId}`}
      className={cn(
        "group relative block min-h-70 overflow-hidden rounded-lg bg-black ring-1 ring-white/10 outline-none",
        "focus-visible:ring-ring focus-visible:ring-3 md:min-h-86",
      )}
      aria-label={`${hero.title} 라이브 보기`}
    >
      <Image
        src={getLiveThumbnailSrc(hero.id, hero.thumbnailUrl)}
        alt={`${hero.title} 라이브 썸네일`}
        fill
        priority
        sizes="(min-width: 1280px) 72rem, 100vw"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-linear-to-r from-black/85 via-black/40 to-black/10" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/90 to-transparent" />

      <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
        <LiveBadge />
        <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-bold text-white backdrop-blur">
          <Play className="size-3 fill-white" />
          {formatViewerCount(hero.currentViewerCount)}
        </span>
      </div>

      <div className="absolute right-4 bottom-4 left-4 flex flex-col gap-4 text-white md:right-6 md:bottom-6 md:left-6">
        <div className="max-w-170 space-y-2">
          <p className="text-live text-sm font-bold">지금 가장 많이 보는 방송</p>
          <h1 className="line-clamp-2 text-2xl leading-tight font-extrabold wrap-break-word md:text-4xl">
            {hero.title}
          </h1>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="size-9 ring-2 ring-white/25" size="lg">
              <AvatarImage
                src={getAvatarImageSrc(hero.creatorPhotoUrl)}
                alt={`${hero.creatorNickname} 프로필 이미지`}
              />
              <AvatarFallback>{getAvatarFallbackText(hero.creatorNickname)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{hero.creatorNickname}</p>
              <p className="text-xs font-semibold text-white/70">
                {formatLiveDuration(hero.startedAt)}
              </p>
            </div>
          </div>

          {tagLabels.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tagLabels.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/15 px-2 py-1 text-xs font-semibold text-white backdrop-blur"
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
