// 팔로잉 채널 행의 아바타(라이브 링 + LIVE 펠릿)를 렌더링합니다.

import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";

interface FollowingChannelAvatarProps {
  creatorId: string;
  creatorNickname: string;
  creatorPhotoUrl: string | null;
  isLive: boolean;
}

export default function FollowingChannelAvatar({
  creatorId,
  creatorNickname,
  creatorPhotoUrl,
  isLive,
}: FollowingChannelAvatarProps) {
  return (
    <Link
      href={`/live/${creatorId}`}
      aria-label={`${creatorNickname} 채널로 이동`}
      className="focus-visible:ring-ring relative shrink-0 rounded-full outline-none focus-visible:ring-3"
    >
      <Avatar
        className={cn(
          "size-14 transition-transform duration-200 group-hover/row:scale-105",
          isLive && "ring-live/80 ring-2",
        )}
        size="sm"
      >
        <AvatarImage
          src={getAvatarImageSrc(creatorPhotoUrl)}
          alt={`${creatorNickname} 프로필 이미지`}
        />
        <AvatarFallback>{getAvatarFallbackText(creatorNickname, 1)}</AvatarFallback>
      </Avatar>

      {isLive && (
        <span className="bg-live text-live-foreground ring-card absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full px-1.5 text-[10px] leading-4 font-black tracking-wide ring-2">
          LIVE
        </span>
      )}
    </Link>
  );
}
