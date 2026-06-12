// 클립 정보 패널 — 제목·채널 링크·조회수·생성 시각·길이를 표시합니다.
// 데스크탑은 우측 사이드 카드, 모바일은 스테이지 위 오버레이 카드로 같은 내용을 쓴다.

import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CLIP_LABEL } from "@/constants/clip/clip";
import { cn } from "@/lib/utils";
import type { LiveClip } from "@/types/clip/clip";
import { formatRelativeTime } from "@/utils/common/format";
import { formatCount } from "@/utils/live/live-chat";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";

export interface ClipShortsCreator {
  id: string;
  nickname: string;
  photoUrl: string | null;
}

interface Props {
  clip: LiveClip;
  creator: ClipShortsCreator | null;
  className?: string;
}

export function ClipInfoPanel({ clip, creator, className }: Props) {
  return (
    <div
      className={cn("bg-card border-border flex flex-col gap-3 rounded-xl border p-4", className)}
    >
      <h2 className="text-foreground line-clamp-2 text-sm font-semibold">{clip.title}</h2>

      {creator && (
        <Link
          href={`/channel/${creator.id}`}
          prefetch={false}
          className="flex w-fit cursor-pointer items-center gap-2"
          aria-label={`${creator.nickname} ${CLIP_LABEL.channelLink}`}
        >
          <Avatar className="size-8">
            <AvatarImage
              src={getAvatarImageSrc(creator.photoUrl)}
              alt={`${creator.nickname} 프로필`}
            />
            <AvatarFallback>{getAvatarFallbackText(creator.nickname)}</AvatarFallback>
          </Avatar>
          <span className="text-foreground text-sm font-medium hover:underline">
            {creator.nickname}
          </span>
        </Link>
      )}

      <p className="text-muted-foreground text-xs">
        조회수 {formatCount(clip.viewCount)}
        {CLIP_LABEL.viewCountSuffix} · {formatRelativeTime(clip.createdAt)} · {clip.durationSeconds}
        {CLIP_LABEL.durationUnit}
      </p>
    </div>
  );
}
