// 크리에이터 아바타, 이름, 팔로워 수, 방송 횟수를 표시합니다.

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCount } from "@/utils/live/live-chat";
import { LIVE_LABEL } from "@/constants/live/live";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";
import type { LiveBroadcast } from "@/types/live/live";

interface Props {
  broadcast: LiveBroadcast;
}

export function LiveCreatorInfo({ broadcast }: Props) {
  const { creator } = broadcast;
  const fallback = getAvatarFallbackText(creator.name);
  const avatarSrc = getAvatarImageSrc(creator.avatarUrl);

  return (
    <div className="flex items-center gap-3 py-1">
      <Avatar size="lg">
        <AvatarImage src={avatarSrc} alt={`${creator.name} 프로필`} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-foreground text-sm font-semibold">{creator.name}</span>
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <span>
            {formatCount(creator.followerCount)} {LIVE_LABEL.followers}
          </span>
        </div>
      </div>
    </div>
  );
}
