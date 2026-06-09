// 팔로잉 채널 목록 카드 안에서 반복되는 채널 행을 렌더링합니다.

import Link from "next/link";
import { Eye } from "lucide-react";

import CreatorAvatarPopover from "@/components/creator/creator-avatar-popover";
import FollowingLiveStatus from "@/components/following/following-live-status";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FollowingChannelPageItem } from "@/types/following/following-page";

interface FollowingChannelRowProps {
  item: FollowingChannelPageItem;
}

export default function FollowingChannelRow({ item }: FollowingChannelRowProps) {
  const channelHref = `/live/${item.creatorId}`;

  return (
    <li>
      <div className="group/row hover:bg-muted/50 -mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors sm:-mx-3 sm:gap-4 sm:px-3">
        <CreatorAvatarPopover
          creatorId={item.creatorId}
          creatorNickname={item.creatorNickname}
          creatorPhotoUrl={item.creatorPhotoUrl}
          isFollowing
          isLive={item.isLive}
          showLiveRing={item.isLive}
          confirmUnfollow
          avatarSize="sm"
          avatarClassName="size-14"
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

        {item.isLive && (
          <Link
            href={channelHref}
            aria-label={`${item.creatorNickname} 라이브 보러가기`}
            className={cn(
              buttonVariants({ size: "sm" }),
              "bg-brand hover:bg-brand/85 shadow-brand/25 h-8 shrink-0 rounded-full px-3 text-xs font-black text-white shadow-sm hover:shadow-md",
            )}
          >
            <Eye className="size-3.5" />
            <span className="hidden sm:inline">보러가기</span>
          </Link>
        )}
      </div>
    </li>
  );
}
