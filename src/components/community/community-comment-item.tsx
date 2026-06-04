"use client";
// 댓글/대댓글 단건. ⋮ 메뉴(수정/삭제) + 좋아요 + (상위 댓글) 답글 토글.

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import CommunityActionMenu from "@/components/community/community-action-menu";
import CommunityCommentLikeButton from "@/components/community/community-comment-like-button";
import CommunityCommentReplies from "@/components/community/community-comment-replies";
import DeleteConfirmDialog from "@/components/common/delete-confirm-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { COMMUNITY_COMMENT_CONTENT_MAX } from "@/constants/community/community";
import { useDeleteCommunityComment } from "@/hooks/community/use-delete-community-comment";
import { useUpdateCommunityComment } from "@/hooks/community/use-update-community-comment";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import type { CommunityComment } from "@/types/community/community";
import { formatRelativeTime } from "@/utils/common/format";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";

interface Props {
  postId: string;
  comment: CommunityComment;
  isChannelOwner: boolean;
  isBest?: boolean;
  isReply?: boolean;
}

const numberFormatter = new Intl.NumberFormat("ko-KR");

export default function CommunityCommentItem({
  postId,
  comment,
  isChannelOwner,
  isBest = false,
  isReply = false,
}: Props) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [repliesOpen, setRepliesOpen] = useState(false);

  const updateComment = useUpdateCommunityComment(postId);
  const deleteComment = useDeleteCommunityComment(postId);

  const channelHref = `/channel/${comment.authorId}`;
  const isAuthor = currentUserId === comment.authorId;
  const canEdit = isAuthor;
  const canDelete = isAuthor || isChannelOwner;

  const trimmedLength = draft.trim().length;
  const isDraftSubmittable =
    trimmedLength > 0 && draft.length <= COMMUNITY_COMMENT_CONTENT_MAX && draft !== comment.content;

  const handleSaveEdit = async () => {
    if (!isDraftSubmittable || updateComment.isPending) {
      return;
    }

    const result = await updateComment.mutateAsync({
      commentId: comment.id,
      content: draft.trim(),
    });

    if (result.success) {
      setIsEditing(false);
    }
  };

  const handleConfirmDelete = async () => {
    const result = await deleteComment.mutateAsync(comment.id);
    if (result.success) {
      setIsDeleteOpen(false);
    }
  };

  return (
    <div className={cn("flex gap-3", isReply ? "py-2" : "py-3")}>
      <Link
        href={channelHref}
        aria-label={`${comment.authorNickname} 채널로 이동`}
        className="focus-visible:ring-ring shrink-0 rounded-full outline-none focus-visible:ring-2"
      >
        <Avatar
          className={cn(
            "hover:ring-brand/40 transition-[box-shadow] hover:ring-2",
            isReply ? "size-8" : "size-9",
          )}
        >
          <AvatarImage
            src={getAvatarImageSrc(comment.authorPhotoUrl)}
            alt={`${comment.authorNickname}의 프로필 사진`}
          />
          <AvatarFallback className="text-xs font-black">
            {getAvatarFallbackText(comment.authorNickname, 1)}
          </AvatarFallback>
        </Avatar>
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
            {isBest && (
              <span className="bg-brand rounded px-1.5 py-0.5 text-[10px] leading-none font-black text-white">
                BEST
              </span>
            )}
            <Link
              href={channelHref}
              className="text-foreground truncate text-sm font-bold hover:underline"
            >
              {comment.authorNickname}
            </Link>
            <span className="text-muted-foreground shrink-0 text-xs">
              {formatRelativeTime(comment.createdAt)}
              {comment.modifiedAt && " · 수정됨"}
            </span>
          </div>

          {!isEditing && (
            <CommunityActionMenu
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={() => {
                setDraft(comment.content);
                setIsEditing(true);
              }}
              onDelete={() => setIsDeleteOpen(true)}
              ariaLabel="댓글 더보기"
              className="-mt-1"
            />
          )}
        </div>

        {isEditing ? (
          <div className="mt-2 flex flex-col gap-2">
            <Textarea
              value={draft}
              maxLength={COMMUNITY_COMMENT_CONTENT_MAX}
              onChange={(event) => setDraft(event.target.value)}
              aria-label="댓글 수정"
              className="min-h-16 resize-none rounded-xl text-base leading-normal md:text-sm"
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={updateComment.isPending}
                onClick={() => {
                  setDraft(comment.content);
                  setIsEditing(false);
                }}
                className="h-8 rounded-lg px-3 text-xs font-semibold"
              >
                취소
              </Button>
              <Button
                type="button"
                disabled={!isDraftSubmittable || updateComment.isPending}
                onClick={handleSaveEdit}
                className="bg-brand hover:bg-brand/85 h-8 rounded-lg px-3 text-xs font-bold text-white"
              >
                {updateComment.isPending ? <Spinner className="size-3.5" /> : "수정"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-foreground/90 mt-1 text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">
            {comment.content}
          </p>
        )}

        {!isEditing && (
          <div className="mt-1.5 flex h-7 items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              {!isReply && (
                <button
                  type="button"
                  onClick={() => setRepliesOpen((open) => !open)}
                  className="text-muted-foreground hover:text-foreground inline-flex h-7 items-center text-xs font-semibold"
                >
                  답글 쓰기
                </button>
              )}
              {!isReply && comment.replyCount > 0 && (
                <button
                  type="button"
                  onClick={() => setRepliesOpen((open) => !open)}
                  className="text-brand inline-flex h-7 items-center gap-0.5 text-xs font-bold"
                  aria-expanded={repliesOpen}
                >
                  답글 {numberFormatter.format(comment.replyCount)}
                  <ChevronDown
                    className={cn("size-3.5 transition-transform", repliesOpen && "rotate-180")}
                  />
                </button>
              )}
            </div>

            <CommunityCommentLikeButton
              commentId={comment.id}
              authorId={comment.authorId}
              isLiked={comment.isLiked}
              likeCount={comment.likeCount}
            />
          </div>
        )}

        {!isReply && repliesOpen && (
          <CommunityCommentReplies
            postId={postId}
            parentId={comment.id}
            isChannelOwner={isChannelOwner}
          />
        )}
      </div>

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={isReply ? "답글 삭제" : "댓글 삭제"}
        description={
          isReply
            ? "이 답글을 삭제할까요?\n삭제한 답글은 복구할 수 없어요."
            : "이 댓글을 삭제할까요?\n달린 답글도 함께 삭제되며 복구할 수 없어요."
        }
        isPending={deleteComment.isPending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
