// 클립 세로 카드 — 9:16 썸네일 한 장에 시네마 딤·길이 뱃지·제목·조회수를 모두 얹는다
// (치지직 결의 인포-온-썸네일 구성). 시청 페이지 섹션과 채널 클립 탭이 같은 카드를 쓴다.

import Image from "next/image";
import Link from "next/link";
import { Eye } from "lucide-react";

import type { LiveClip } from "@/types/clip/clip";
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
            className="object-cover opacity-90 transition-[transform,opacity] duration-200 group-hover:scale-105 group-hover:opacity-100"
          />
        ) : null}

        {/* 시네마 딤 — 밝은 썸네일을 진하게 가라앉히고 하단 텍스트 가독성을 확보한다 */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/45" />

        {/* 길이 뱃지 */}
        <span className="absolute top-1.5 right-1.5 rounded bg-black/65 px-1.5 py-0.5 font-mono text-[11px] leading-none text-white backdrop-blur-sm">
          {formatElapsedTime(clip.durationSeconds)}
        </span>

        {/* 제목 + 조회수(썸네일 내부 하단 오버레이) */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-2">
          <h3 className="truncate text-xs font-semibold text-white drop-shadow-sm">{clip.title}</h3>
          <span className="flex items-center gap-1 text-[11px] font-medium text-white/85">
            <Eye className="size-3 shrink-0" aria-hidden />
            {formatCount(clip.viewCount)}
          </span>
        </div>
      </div>
    </Link>
  );
}
