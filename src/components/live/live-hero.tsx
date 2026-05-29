// 라이브 목록 상단의 대표 방송 Hero를 렌더링합니다.

import Image from "next/image";
import Link from "next/link";
import { Radio } from "lucide-react";

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
      <section className="border-border bg-card flex min-h-52 flex-col justify-between rounded-xl border p-5 shadow-sm md:min-h-64 md:p-7">
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
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
      <Link
        href={`/live/${hero.creatorId}`}
        className={cn(
          "group relative min-h-72 overflow-hidden rounded-xl bg-black shadow-sm ring-1 ring-black/5 outline-none",
          "focus-visible:ring-ring focus-visible:ring-3 md:min-h-96",
        )}
        aria-label={`${hero.title} 라이브 보기`}
      >
        <Image
          src={getLiveThumbnailSrc(hero.id, hero.thumbnailUrl)}
          alt={`${hero.title} 라이브 썸네일`}
          fill
          priority
          sizes="(min-width: 1024px) 62vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-black/10" />
        <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
          <LiveBadge />
          <span className="rounded-full bg-black/55 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
            {formatViewerCount(hero.currentViewerCount)}
          </span>
        </div>
        <div className="absolute right-4 bottom-4 left-4 flex flex-col gap-4 text-white">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-white/80">
              {formatLiveDuration(hero.startedAt)}
            </p>
            <h1 className="line-clamp-2 text-2xl leading-tight font-bold wrap-break-word md:text-4xl">
              {hero.title}
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar className="size-9" size="lg">
                <AvatarImage
                  src={getAvatarImageSrc(hero.creatorPhotoUrl)}
                  alt={`${hero.creatorNickname} 프로필 이미지`}
                />
                <AvatarFallback>{getAvatarFallbackText(hero.creatorNickname)}</AvatarFallback>
              </Avatar>
              <span className="truncate text-sm font-semibold">{hero.creatorNickname}</span>
            </div>

            {tagLabels.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {tagLabels.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/15 px-2 py-1 text-xs font-medium text-white backdrop-blur"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </Link>

      <aside className="border-border bg-card flex flex-col justify-between rounded-xl border p-5 shadow-sm md:p-6">
        <div className="space-y-3">
          <p className="text-live text-sm font-bold">지금 가장 많이 보는 방송</p>
          <h2 className="text-foreground text-2xl leading-tight font-bold wrap-break-word">
            지금 많이 보는 라이브를 바로 볼 수 있어요.
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            필터와 정렬을 바꾸면 원하는 분위기의 방송을 더 빠르게 찾을 수 있어요.
          </p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2 text-sm">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-muted-foreground">시청자</p>
            <p className="text-foreground mt-1 font-bold">
              {formatViewerCount(hero.currentViewerCount)}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-muted-foreground">방송 시간</p>
            <p className="text-foreground mt-1 font-bold">{formatLiveDuration(hero.startedAt)}</p>
          </div>
        </div>
      </aside>
    </section>
  );
}
