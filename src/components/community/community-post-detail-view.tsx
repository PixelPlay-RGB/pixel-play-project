"use client";
// 게시글 상세 뷰: 상단 툴바(목록 + 이전/다음글) + 게시글 카드(작성자·본문·좋아요·⋮) + 댓글 영역.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";

import CommunityActionMenu from "@/components/community/community-action-menu";
import CommunityCommentList from "@/components/community/community-comment-list";
import CommunityDeleteDialog from "@/components/community/community-delete-dialog";
import CommunityLikeButton from "@/components/community/community-like-button";
import CommunityPostPager from "@/components/community/community-post-pager";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCommunityPostDetail } from "@/hooks/community/use-community-post-detail";
import { useDeleteCommunityPost } from "@/hooks/community/use-delete-community-post";
import type {
  CommunityAdjacentPosts,
  CommunityCommentsResult,
  CommunityPostDetail,
} from "@/types/community/community";
import { formatRelativeTime } from "@/utils/common/format";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";

interface Props {
  creatorId: string;
  post: CommunityPostDetail;
  isChannelOwner: boolean;
  initialComments: CommunityCommentsResult;
  neighbors: CommunityAdjacentPosts;
}

export default function CommunityPostDetailView({
  creatorId,
  post,
  isChannelOwner,
  initialComments,
  neighbors,
}: Props) {
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { data } = useCommunityPostDetail(post.id, post);
  const deletePost = useDeleteCommunityPost(post.id);

  const detail = data ?? post;
  const communityHref = `/channel/${creatorId}/community`;

  const handleConfirmDelete = async () => {
    const result = await deletePost.mutateAsync();
    if (result.success) {
      setIsDeleteOpen(false);
      router.push(communityHref);
    }
  };

  return (
    <article className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={communityHref}
          className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-0.5 text-sm font-semibold"
        >
          <ChevronLeft className="size-4" />
          목록으로
        </Link>

        <CommunityPostPager creatorId={creatorId} neighbors={neighbors} />
      </div>

      <div className="border-border/60 bg-card/40 overflow-hidden rounded-2xl border">
        {/* 게시글 */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href={`/channel/${detail.creatorId}`}
                aria-label={`${detail.creatorNickname} 채널로 이동`}
                className="focus-visible:ring-ring shrink-0 rounded-full outline-none focus-visible:ring-2"
              >
                <Avatar className="hover:ring-brand/40 size-11 transition-[box-shadow] hover:ring-2">
                  <AvatarImage
                    src={getAvatarImageSrc(detail.creatorPhotoUrl)}
                    alt={`${detail.creatorNickname}의 프로필 사진`}
                  />
                  <AvatarFallback className="text-sm font-black">
                    {getAvatarFallbackText(detail.creatorNickname, 1)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="min-w-0">
                <Link
                  href={`/channel/${detail.creatorId}`}
                  className="text-foreground block truncate text-sm font-bold hover:underline"
                >
                  {detail.creatorNickname}
                </Link>
                <p className="text-muted-foreground text-xs">
                  {formatRelativeTime(detail.createdAt)}
                  {detail.modifiedAt && " · 수정됨"}
                </p>
              </div>
            </div>

            {isChannelOwner && (
              <CommunityActionMenu
                canEdit
                canDelete
                onEdit={() => router.push(`${communityHref}/write?postId=${detail.id}`)}
                onDelete={() => setIsDeleteOpen(true)}
                ariaLabel="게시글 더보기"
              />
            )}
          </div>

          <p className="text-foreground mt-3 text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">
            {detail.content}
          </p>

          <div className="mt-4 flex items-center justify-end">
            <CommunityLikeButton
              postId={detail.id}
              authorId={detail.creatorId}
              isLiked={detail.isLiked}
              likeCount={detail.likeCount}
            />
          </div>
        </div>

        {/* 댓글 영역 (같은 카드 안, 구분선으로 분리) */}
        <section className="border-border/60 border-t p-4 sm:p-5">
          <CommunityCommentList
            postId={detail.id}
            commentCount={detail.commentCount}
            isChannelOwner={isChannelOwner}
            initialData={initialComments}
          />
        </section>
      </div>

      <CommunityDeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="게시글 삭제"
        description={"이 게시글을 삭제할까요?\n댓글을 포함해 모두 삭제되며 복구할 수 없어요."}
        isPending={deletePost.isPending}
        onConfirm={handleConfirmDelete}
      />
    </article>
  );
}
