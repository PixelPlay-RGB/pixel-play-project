"use client";
// 게시글 상세 뷰: 본문 + 좋아요 + (채널 주인)수정/삭제 + 댓글 영역.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import CommunityCommentComposer from "@/components/community/community-comment-composer";
import CommunityCommentList from "@/components/community/community-comment-list";
import CommunityLikeButton from "@/components/community/community-like-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useCommunityPostDetail } from "@/hooks/community/use-community-post-detail";
import { useDeleteCommunityPost } from "@/hooks/community/use-delete-community-post";
import { cn } from "@/lib/utils";
import type { CommunityCommentsResult, CommunityPostDetail } from "@/types/community/community";
import { formatRelativeTime } from "@/utils/common/format";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";

interface Props {
  creatorId: string;
  post: CommunityPostDetail;
  isChannelOwner: boolean;
  initialComments: CommunityCommentsResult;
}

const numberFormatter = new Intl.NumberFormat("ko-KR");

export default function CommunityPostDetailView({
  creatorId,
  post,
  isChannelOwner,
  initialComments,
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
    <article className="flex flex-col gap-5">
      <Link
        href={communityHref}
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1 text-sm font-semibold"
      >
        <ArrowLeft className="size-4" />
        커뮤니티
      </Link>

      <div className="flex items-center gap-3">
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

      <p className="text-foreground text-[0.95rem] leading-relaxed break-words whitespace-pre-wrap">
        {detail.content}
      </p>

      <div className="border-border/60 flex items-center justify-between border-y py-3">
        <div className="flex items-center gap-3">
          <CommunityLikeButton
            postId={detail.id}
            isLiked={detail.isLiked}
            likeCount={detail.likeCount}
          />
          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs font-semibold">
            <MessageSquare className="size-3.5" />
            {numberFormatter.format(detail.commentCount)}
          </span>
        </div>

        {isChannelOwner && (
          <div className="flex items-center gap-1.5">
            <Link
              href={`${communityHref}/write?postId=${detail.id}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-8 rounded-lg px-2.5 text-xs font-semibold",
              )}
            >
              <Pencil className="size-3.5" />
              수정
            </Link>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              className="text-muted-foreground hover:text-destructive h-8 rounded-lg px-2.5 text-xs font-semibold"
            >
              <Trash2 className="size-3.5" />
              삭제
            </Button>
          </div>
        )}
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-foreground text-sm font-black">
          댓글 {numberFormatter.format(detail.commentCount)}
        </h2>
        <CommunityCommentComposer postId={detail.id} />
        <CommunityCommentList
          postId={detail.id}
          isChannelOwner={isChannelOwner}
          initialData={initialComments}
        />
      </section>

      <AlertDialog
        open={isDeleteOpen}
        onOpenChange={(next) => {
          if (!deletePost.isPending) setIsDeleteOpen(next);
        }}
      >
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>게시글 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 게시글을 삭제할까요? 댓글을 포함해 모두 삭제되며 복구할 수 없어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePost.isPending}>취소</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              type="button"
              disabled={deletePost.isPending}
              onClick={handleConfirmDelete}
            >
              {deletePost.isPending ? <Spinner className="size-4" /> : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}
