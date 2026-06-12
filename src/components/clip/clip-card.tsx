// 클립 세로 카드 — 9:16 썸네일 + 길이 뱃지 + 제목 + 조회수·시각. 시청 페이지 섹션과
// 채널 클립 탭이 같은 카드를 쓴다(디테일 /clip/[clipId]로 이동).

import Image from "next/image";
import Link from "next/link";

import { CLIP_LABEL } from "@/constants/clip/clip";
import type { LiveClip } from "@/types/clip/clip";
import { formatRelativeTime } from "@/utils/common/format";
import { formatCount, formatElapsedTime } from "@/utils/live/live-chat";

interface Props {
  clip: LiveClip;
  // 그리드 칼럼 폭에 맞춘 next/image sizes 힌트(컨테이너별로 덮어쓴다).
  sizes?: string;
}

export function ClipCard({
  clip,
  sizes = "(min-width: 1536px) 15vw, (min-width: 640px) 22vw, 45vw",
}: Props) {
  return (
    <Link href={`/clip/${clip.id}`} prefetch={false} className="group block min-w-0">
      <div className="relative aspect-[9/16] overflow-hidden rounded-lg bg-black">
        {clip.thumbnailUrl ? (
          <Image
            src={clip.thumbnailUrl}
            alt={clip.title}
            fill
            sizes={sizes}
            className="object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : null}
        <span className="absolute right-1.5 bottom-1.5 rounded bg-black/70 px-1 py-0.5 font-mono text-[11px] leading-none text-white">
          {formatElapsedTime(clip.durationSeconds)}
        </span>
      </div>
      <h3 className="text-foreground mt-2 line-clamp-2 text-sm leading-snug font-medium">
        {clip.title}
      </h3>
      <p className="text-muted-foreground mt-0.5 text-xs">
        조회수 {formatCount(clip.viewCount)}
        {CLIP_LABEL.viewCountSuffix} · {formatRelativeTime(clip.createdAt)}
      </p>
    </Link>
  );
}
