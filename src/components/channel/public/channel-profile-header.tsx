"use client";
// 공개 채널 헤더: 아바타·닉네임·팔로워 수·팔로우(또는 내 채널 설정) 버튼을 렌더링합니다.

import Link from "next/link";
import { Settings, UsersRound } from "lucide-react";

import CreatorFollowingButton from "@/components/following/creator-following-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { useToggleChannelFollowing } from "@/hooks/channel/use-toggle-channel-following";
import { cn } from "@/lib/utils";
import type { ChannelProfile } from "@/types/channel/channel";
import { formatNumber } from "@/utils/common/format";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";

interface Props {
  profile: ChannelProfile;
}

export default function ChannelProfileHeader({ profile }: Props) {
  const { isFollowing, followerCount, isPending, toggle } = useToggleChannelFollowing({
    creatorId: profile.id,
    initialIsFollowing: profile.isFollowing,
    initialFollowerCount: profile.followerCount,
  });

  const avatarSrc = getAvatarImageSrc(profile.photoUrl);
  const fallbackText = getAvatarFallbackText(profile.nickname, 1);

  return (
    <div className="flex items-center gap-4 py-6 sm:gap-5">
      <Link
        href={`/channel/${profile.id}`}
        aria-label={`${profile.nickname} 채널 홈으로 이동`}
        className="group/avatar focus-visible:ring-live shrink-0 rounded-full outline-none focus-visible:ring-2"
      >
        {/* hover/focus 시 live 컬러 얇은 링 + 투명도 변화로 클릭 가능함을 표시. */}
        <Avatar className="ring-live size-16 ring-0 transition-all group-hover/avatar:opacity-75 group-hover/avatar:ring-2 sm:size-20">
          <AvatarImage src={avatarSrc} alt={`${profile.nickname}의 프로필 사진`} />
          <AvatarFallback className="text-lg font-black">{fallbackText}</AvatarFallback>
        </Avatar>
      </Link>

      <div className="min-w-0 flex-1">
        <h1 className="text-foreground truncate text-lg font-black sm:text-xl">
          {profile.nickname}
        </h1>
        <p
          className={cn(
            "text-muted-foreground mt-1 flex items-center gap-1",
            "text-xs font-semibold sm:text-sm",
          )}
        >
          <UsersRound className="size-3.5 shrink-0" />
          팔로워 {formatNumber(followerCount)}
        </p>
        {profile.bio && (
          <p className="text-muted-foreground/90 mt-1.5 line-clamp-2 text-xs leading-relaxed whitespace-pre-wrap sm:text-sm">
            {profile.bio}
          </p>
        )}
      </div>

      {profile.isOwnChannel ? (
        <Link
          href={`/channel/${profile.id}/setting`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-9 shrink-0 gap-1.5 rounded-full px-4 text-sm font-bold",
          )}
        >
          <Settings className="size-4" />
          채널 설정
        </Link>
      ) : (
        <CreatorFollowingButton
          creatorNickname={profile.nickname}
          isFollowing={isFollowing}
          isOwnChannel={profile.isOwnChannel}
          isPending={isPending}
          onClick={toggle}
          className="h-9 px-4 text-sm"
        />
      )}
    </div>
  );
}
