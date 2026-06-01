"use client";
// 라이브 카드에서 크리에이터 요약 Popover를 렌더링합니다.

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CreatorFollowingButton from "@/components/following/creator-following-button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToggleCreatorFollowing } from "@/hooks/following/use-toggle-creator-following";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";

interface LiveCreatorPopoverProps {
  creatorId: string;
  creatorNickname: string;
  creatorPhotoUrl: string | null;
  isFollowing: boolean;
}

export default function LiveCreatorPopover({
  creatorId,
  creatorNickname,
  creatorPhotoUrl,
  isFollowing,
}: LiveCreatorPopoverProps) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const toggleCreatorFollowing = useToggleCreatorFollowing();
  const avatarSrc = getAvatarImageSrc(creatorPhotoUrl);
  const fallbackText = getAvatarFallbackText(creatorNickname);
  const isOwnChannel = currentUserId === creatorId;
  const isPending =
    toggleCreatorFollowing.isPending && toggleCreatorFollowing.variables?.creatorId === creatorId;

  const handleFollowingClick = () => {
    if (isOwnChannel || isPending) {
      return;
    }

    toggleCreatorFollowing.mutate({
      creatorId,
      nextFollowing: !isFollowing,
    });
  };

  return (
    <Popover>
      <PopoverTrigger
        type="button"
        className={cn(
          "focus-visible:ring-ring mt-0.5 shrink-0 rounded-full outline-none focus-visible:ring-3",
          "group/avatar-trigger relative z-20 cursor-pointer",
        )}
        aria-label={`${creatorNickname} 프로필 요약 열기`}
      >
        <Avatar
          className={cn(
            "size-9 border-2 border-transparent transition-colors",
            "group-hover/avatar-trigger:border-live/80 group-focus-visible/avatar-trigger:border-live/80",
          )}
          size="lg"
        >
          <AvatarImage src={avatarSrc} alt={`${creatorNickname} 프로필 이미지`} />
          <AvatarFallback>{fallbackText}</AvatarFallback>
        </Avatar>
      </PopoverTrigger>

      <PopoverContent className="w-64 gap-3 p-3" align="start" sideOffset={8}>
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-12" size="lg">
            <AvatarImage src={avatarSrc} alt={`${creatorNickname} 프로필 이미지`} />
            <AvatarFallback>{fallbackText}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-foreground truncate text-sm font-black">{creatorNickname}</p>
            <p className="text-muted-foreground text-xs font-medium">
              {isOwnChannel ? "내 라이브 채널이에요." : "다시 보고 싶은 채널로 저장해요."}
            </p>
          </div>
        </div>

        <CreatorFollowingButton
          creatorNickname={creatorNickname}
          isFollowing={isFollowing}
          isOwnChannel={isOwnChannel}
          isPending={isPending}
          onClick={handleFollowingClick}
          className="w-full"
        />
      </PopoverContent>
    </Popover>
  );
}
