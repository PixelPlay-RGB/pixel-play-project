// 스트리머 정보 행(아바타·이름·팔로워 + 팔로우/공유). 라이브·방송 종료 양쪽에서 동일하게 쓴다.

import { LiveCreatorActions } from "@/components/live/view/live-creator-actions";
import { LiveCreatorInfo } from "@/components/live/view/live-creator-info";
import { cn } from "@/lib/utils";
import type { LiveCreator } from "@/types/live/live";

interface Props {
  creator: LiveCreator;
  isLive: boolean;
  isFollowing: boolean;
  isPending: boolean;
  onFollow: () => void;
  className?: string;
}

export function LiveStreamerRow({
  creator,
  isLive,
  isFollowing,
  isPending,
  onFollow,
  className,
}: Props) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <LiveCreatorInfo creator={creator} isLive={isLive} />
      <LiveCreatorActions
        creatorNickname={creator.name}
        isFollowing={isFollowing}
        isPending={isPending}
        onFollow={onFollow}
      />
    </div>
  );
}
