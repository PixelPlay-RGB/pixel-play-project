"use client";
// 커뮤니티 목록의 게시글 카드. 본문 클릭 시 상세 이동, 채널 주인은 ⋮ 메뉴(수정/삭제).

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, MessageSquare } from "lucide-react";
import { useState } from "react";

import CommunityActionMenu from "@/components/community/community-action-menu";
import DeleteConfirmDialog from "@/components/common/delete-confirm-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDeleteCommunityPost } from "@/hooks/community/use-delete-community-post";
import type { CommunityCreator, CommunityPost } from "@/types/community/community";
import { formatRelativeTime } from "@/utils/common/format";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";

interface Props {
  creatorId: string;
  creator: CommunityCreator;
  post: CommunityPost;
  isOwner: boolean;
}

const numberFormatter = new Intl.NumberFormat("ko-KR");

export default function CommunityPostCard({ creatorId, creator, post, isOwner }: Props) {
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const deletePost = useDeleteCommunityPost(post.id);

  const detailHref = `/channel/${creatorId}/community/${post.id}`;

  const handleConfirmDelete = async () => {
    const result = await deletePost.mutateAsync();
    if (result.success) {
      setIsDeleteOpen(false);
    }
  };

  return (
    <div className="border-border/60 bg-card/60 hover:border-brand/30 hover:bg-card relative rounded-2xl border transition-colors">
      <Link href={detailHref} className="block p-4 sm:p-5">
        <div className="flex items-center gap-2.5 pr-8">
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

        <p className="text-foreground/90 mt-3 line-clamp-3 text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">
          {post.content}
        </p>

        <div className="text-muted-foreground mt-3 flex items-center justify-end gap-4 text-xs font-semibold">
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

      {isOwner && (
        <div className="absolute top-3 right-3 z-10">
          <CommunityActionMenu
            canEdit
            canDelete
            onEdit={() => router.push(`/channel/${creatorId}/community/write?postId=${post.id}`)}
            onDelete={() => setIsDeleteOpen(true)}
            ariaLabel="게시글 더보기"
          />
        </div>
      )}

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="게시글 삭제"
        description={"이 게시글을 삭제할까요?\n댓글을 포함해 모두 삭제되며 복구할 수 없어요."}
        isPending={deletePost.isPending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
