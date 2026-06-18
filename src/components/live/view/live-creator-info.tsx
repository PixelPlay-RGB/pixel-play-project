// 크리에이터 아바타(채널 페이지 링크), 이름, 팔로워 수를 표시합니다.

import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CREATOR_AVATAR_TRIGGER_AVATAR_CLASS,
  CREATOR_AVATAR_TRIGGER_CLASS,
} from "@/constants/creator/creator";
import { formatCount } from "@/utils/live/live-chat";
import { LIVE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";
import type { LiveCreator } from "@/types/live/live";

interface Props {
  creator: LiveCreator;
  // 라이브 중이면 사이드바 라이브 아바타와 동일한 라이브 링을 두른다.
  isLive?: boolean;
}

export function LiveCreatorInfo({ creator, isLive = false }: Props) {
  const fallback = getAvatarFallbackText(creator.name);
  const avatarSrc = getAvatarImageSrc(creator.avatarUrl);

  return (
    <div className="flex items-center gap-3 py-1">
      {/* 이미 이 스트리머를 시청 중이라 아바타는 라이브 이동 대신 채널 페이지로 보낸다.
          항상 화면에 떠 있는 링크라 prefetch는 끈다(시청자마다 채널 페이지 선요청 방지). */}
      <Link
        href={`/channel/${creator.id}`}
        prefetch={false}
        aria-label={`${creator.name} 채널 보기`}
        className={CREATOR_AVATAR_TRIGGER_CLASS}
      >
        {/* 시청 페이지의 채널 행은 유튜브·치지직처럼 아바타를 한 단계 크게(48px) 보여준다.
            (size prop의 data variant는 specificity가 높아 클래스로 못 덮으므로 클래스로만 지정) */}
        <Avatar
          className={cn(
            "size-12",
            CREATOR_AVATAR_TRIGGER_AVATAR_CLASS,
            isLive && "ring-live/80 ring-2",
          )}
        >
          <AvatarImage src={avatarSrc} alt={`${creator.name} 프로필`} />
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-foreground min-w-0 truncate text-base font-bold">{creator.name}</span>
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <span>
            {formatCount(creator.followerCount)} {LIVE_LABEL.followers}
          </span>
        </div>
      </div>
    </div>
  );
}
