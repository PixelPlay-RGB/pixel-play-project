"use client";
// 라이브 크리에이터 검색 결과 카드를 렌더링합니다.
import CreatorFollowingButton from "@/components/following/creator-following-button";
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToggleLiveSearchFollowing } from "@/hooks/following/use-toggle-live-search-following";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import type { LiveSearchResult } from "@/types/search/search";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";
import { Radio, UsersRound } from "lucide-react";
import Link from "next/link";

interface Props {
  result: LiveSearchResult;
}

const numberFormatter = new Intl.NumberFormat("ko-KR");

export default function LiveCreatorResultCard({ result }: Props) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const toggleLiveSearchFollowing = useToggleLiveSearchFollowing();
  const avatarSrc = getAvatarImageSrc(result.creator_photo_url);
  const fallbackText = getAvatarFallbackText(result.creator_nickname, 1);
  const isOwnChannel = currentUserId === result.creator_id;
  const isFollowingPending =
    toggleLiveSearchFollowing.isPending &&
    toggleLiveSearchFollowing.variables?.creatorId === result.creator_id;

  const handleFollowingClick = () => {
    if (isOwnChannel || isFollowingPending) {
      return;
    }

    toggleLiveSearchFollowing.mutate({
      creatorId: result.creator_id,
      nextFollowing: !result.is_following,
    });
  };

  return (
    <div
      className={cn(
        "flex min-h-22 flex-col gap-3 rounded-xl border p-3 text-left sm:flex-row sm:items-center",
        "border-border/55 bg-card/80 transition-colors duration-200",
        "dark:border-border/35 dark:bg-card/70",
        result.is_live && "border-brand/20 bg-brand/4 dark:border-brand/15 dark:bg-brand/6",
      )}
    >
      <Link
        href={`/live/${result.creator_id}`}
        prefetch={false}
        className={cn("group/link flex min-w-0 flex-1", "items-center gap-3")}
      >
        <Avatar className="h-12 w-12">
          <AvatarImage src={avatarSrc} alt={`${result.creator_nickname}의 프로필 사진`} />
          <AvatarFallback className="text-sm font-black">{fallbackText}</AvatarFallback>
          {result.is_live && <AvatarBadge className="bg-live" />}
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h3
              className={cn(
                "text-foreground group-hover/link:text-brand truncate",
                "text-sm font-black transition-colors",
              )}
            >
              {result.creator_nickname}
            </h3>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-md",
                "px-2 py-0.5 text-xs font-black",
                result.is_live
                  ? "bg-live text-white"
                  : "bg-muted text-muted-foreground dark:bg-muted/70",
              )}
            >
              {result.is_live ? "방송 중" : "오프라인"}
            </span>
          </div>

          <p className={cn("text-muted-foreground mt-1", "line-clamp-1 text-xs")}>
            {result.is_live && result.title ? result.title : "현재 진행 중인 방송이 없습니다."}
          </p>

          <div className={cn("mt-2 flex flex-wrap items-center gap-2", "text-xs font-semibold")}>
            {result.is_live && (
              <span className={cn("text-live inline-flex", "items-center gap-1")}>
                <Radio className="size-3" />
                {numberFormatter.format(result.current_viewer_count)}명 시청 중
              </span>
            )}
            <span className={cn("text-muted-foreground inline-flex", "items-center gap-1")}>
              <UsersRound className="size-3" />
              팔로워 {numberFormatter.format(result.follower_count)}
            </span>
          </div>
        </div>
      </Link>

      <CreatorFollowingButton
        creatorNickname={result.creator_nickname}
        isFollowing={result.is_following}
        isOwnChannel={isOwnChannel}
        isPending={isFollowingPending}
        onClick={handleFollowingClick}
        className="w-full sm:ml-auto sm:w-auto"
      />
    </div>
  );
}
