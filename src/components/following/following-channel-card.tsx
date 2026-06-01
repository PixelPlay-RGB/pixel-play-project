// 팔로잉 채널 목록의 개별 카드를 렌더링합니다.

import Link from "next/link";

import FollowingCardActions from "@/components/following/following-card-actions";
import FollowingLiveStatus from "@/components/following/following-live-status";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { FollowingChannelPageItem } from "@/types/following/following-page";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";

interface FollowingChannelCardProps {
  item: FollowingChannelPageItem;
}

export default function FollowingChannelCard({ item }: FollowingChannelCardProps) {
  const channelHref = `/live/${item.creatorId}`;

  return (
    <li className="bg-card text-card-foreground ring-foreground/10 hover:ring-brand/30 flex items-center gap-3 rounded-xl px-3 py-3 ring-1 transition-all sm:gap-4 sm:px-4">
      <Link
        href={channelHref}
        aria-label={`${item.creatorNickname} 채널로 이동`}
        className="focus-visible:ring-ring shrink-0 rounded-full outline-none focus-visible:ring-3"
      >
        <Avatar className={cn("size-11", item.isLive && "ring-live/80 ring-2")} size="sm">
          <AvatarImage
            src={getAvatarImageSrc(item.creatorPhotoUrl)}
            alt={`${item.creatorNickname} 프로필 이미지`}
          />
          <AvatarFallback>{getAvatarFallbackText(item.creatorNickname, 1)}</AvatarFallback>
        </Avatar>
      </Link>

      <div className="min-w-0 flex-1 space-y-1.5">
        <Link
          href={channelHref}
          className="text-foreground focus-visible:ring-ring inline-block max-w-full truncate rounded-sm text-sm font-bold outline-none focus-visible:ring-3"
        >
          {item.creatorNickname}
        </Link>
        <FollowingLiveStatus item={item} />
      </div>

      <FollowingCardActions
        creatorId={item.creatorId}
        creatorNickname={item.creatorNickname}
        isLive={item.isLive}
      />
    </li>
  );
}
