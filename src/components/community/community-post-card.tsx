// 커뮤니티 목록의 게시글 카드입니다. 클릭 시 상세로 이동합니다.
import Link from "next/link";
import { Heart, MessageSquare } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CommunityCreator, CommunityPost } from "@/types/community/community";
import { formatRelativeTime } from "@/utils/common/format";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";

interface Props {
  creatorId: string;
  creator: CommunityCreator;
  post: CommunityPost;
}

const numberFormatter = new Intl.NumberFormat("ko-KR");

export default function CommunityPostCard({ creatorId, creator, post }: Props) {
  return (
    <Link
      href={`/channel/${creatorId}/community/${post.id}`}
      className="border-border/60 bg-card/60 hover:border-brand/30 hover:bg-card block rounded-2xl border p-4 transition-colors sm:p-5"
    >
      <div className="flex items-center gap-2.5">
        <Avatar className="size-9">
          <AvatarImage src={getAvatarImageSrc(creator.photoUrl)} alt={`${creator.nickname}`} />
          <AvatarFallback className="text-xs font-black">
            {getAvatarFallbackText(creator.nickname, 1)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-foreground truncate text-sm font-bold">{creator.nickname}</p>
          <p className="text-muted-foreground text-xs">
            {formatRelativeTime(post.createdAt)}
            {post.modifiedAt && " · 수정됨"}
          </p>
        </div>
      </div>

      <p className="text-foreground/90 mt-3 line-clamp-3 text-sm leading-relaxed break-words whitespace-pre-wrap">
        {post.content}
      </p>

      <div className="text-muted-foreground mt-3 flex items-center gap-4 text-xs font-semibold">
        <span className="inline-flex items-center gap-1">
          <Heart className="size-3.5" />
          {numberFormatter.format(post.likeCount)}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="size-3.5" />
          {numberFormatter.format(post.commentCount)}
        </span>
      </div>
    </Link>
  );
}
