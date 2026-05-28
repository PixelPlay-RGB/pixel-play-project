// 라이브 크리에이터 검색 결과 카드를 렌더링합니다.
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { LiveSearchResult } from "@/types/search/search";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";
import { Radio, UsersRound } from "lucide-react";
import Link from "next/link";

interface Props {
  result: LiveSearchResult;
}

const numberFormatter = new Intl.NumberFormat("ko-KR");

export default function LiveCreatorResultCard({ result }: Props) {
  const avatarSrc = getAvatarImageSrc(result.creator_photo_url);
  const fallbackText = getAvatarFallbackText(result.creator_nickname, 1);

  return (
    <Link
      href={`/live/${result.creator_id}`}
      prefetch={false}
      className={cn(
        "group flex min-h-26 items-center gap-4 rounded-2xl border p-4 text-left",
        "border-border/60 bg-card shadow-sm transition-all duration-200",
        "hover:border-brand/40 hover:shadow-brand/10 hover:-translate-y-0.5 hover:shadow-md",
        "dark:border-border/40 dark:hover:border-brand/30 dark:hover:bg-accent/40",
      )}
    >
      <Avatar className="h-14 w-14">
        <AvatarImage src={avatarSrc} alt={`${result.creator_nickname}의 프로필 사진`} />
        <AvatarFallback className="text-base font-black">{fallbackText}</AvatarFallback>
        {result.is_live && <AvatarBadge className="bg-live" />}
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="text-foreground truncate text-sm font-black">{result.creator_nickname}</h3>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-black",
              result.is_live
                ? "bg-live text-white"
                : "bg-muted text-muted-foreground dark:bg-muted/70",
            )}
          >
            {result.is_live ? "LIVE" : "OFF"}
          </span>
        </div>

        <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
          {result.is_live && result.title ? result.title : "현재 진행 중인 방송이 없습니다."}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
          {result.is_live && (
            <span className="text-live inline-flex items-center gap-1">
              <Radio className="h-3 w-3" />
              {numberFormatter.format(result.current_viewer_count)}명 시청 중
            </span>
          )}
          <span className="text-muted-foreground inline-flex items-center gap-1">
            <UsersRound className="h-3 w-3" />
            팔로워 {numberFormatter.format(result.follower_count)}
          </span>
        </div>
      </div>
    </Link>
  );
}
