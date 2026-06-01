// 팔로잉 채널 목록 카드 안에서 반복되는 채널 행을 렌더링합니다.

import Link from "next/link";

import FollowingCardActions from "@/components/following/following-card-actions";
import FollowingChannelAvatar from "@/components/following/following-channel-avatar";
import FollowingLiveStatus from "@/components/following/following-live-status";
import type { FollowingChannelPageItem } from "@/types/following/following-page";

interface FollowingChannelRowProps {
  item: FollowingChannelPageItem;
}

export default function FollowingChannelRow({ item }: FollowingChannelRowProps) {
  const channelHref = `/live/${item.creatorId}`;

  return (
    <li>
      <div className="group/row hover:bg-muted/50 -mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors sm:-mx-3 sm:gap-4 sm:px-3">
        <FollowingChannelAvatar
          creatorId={item.creatorId}
          creatorNickname={item.creatorNickname}
          creatorPhotoUrl={item.creatorPhotoUrl}
          isLive={item.isLive}
        />

        <div className="min-w-0 flex-1 space-y-1.5">
          <Link
            href={channelHref}
            className="text-foreground group-hover/row:text-brand focus-visible:ring-ring inline-block max-w-full truncate rounded-sm text-sm font-bold transition-colors outline-none focus-visible:ring-3"
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
      </div>
    </li>
  );
}
