"use client";
// 댓글/대댓글 단건. ⋮ 메뉴(수정/삭제) + 좋아요 + (상위 댓글) 답글 토글.

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import CommunityActionMenu from "@/components/community/community-action-menu";
import CommunityCommentLikeButton from "@/components/community/community-comment-like-button";
import CommunityCommentReplies from "@/components/community/community-comment-replies";
import ClampedText from "@/components/common/clamped-text";
import DeleteConfirmDialog from "@/components/common/delete-confirm-dialog";
import RelativeTime from "@/components/common/relative-time";
import RichMessageText from "@/components/common/rich-message-text";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { COMMUNITY_COMMENT_CONTENT_MAX } from "@/constants/community/community";
import { useDeleteCommunityComment } from "@/hooks/community/use-delete-community-comment";
import { useUpdateCommunityComment } from "@/hooks/community/use-update-community-comment";
import { useViewerId } from "@/hooks/common/use-viewer-id";
import { cn } from "@/lib/utils";
import type { CommunityComment } from "@/types/community/community";
import { formatNumber } from "@/utils/common/format";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";

interface Props {
  postId: string;
  // 서버에서 확인한 시청자 id(비로그인 null). 인증 게이팅의 1차 기준.
  viewerId: string | null;
  comment: CommunityComment;
  isChannelOwner: boolean;
  isBest?: boolean;
  isReply?: boolean;
}

export default function CommunityCommentItem({
  postId,
  viewerId,
  comment,
  isChannelOwner,
  isBest = false,
  isReply = false,
}: Props) {
  const currentUserId = useViewerId(viewerId);
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
              <span className="bg-brand text-brand-foreground text-2xs rounded px-1.5 py-0.5 leading-none font-black">
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
              <RelativeTime iso={comment.createdAt} />
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
                className="bg-brand hover:bg-brand/85 text-brand-foreground h-8 rounded-lg px-3 text-xs font-bold"
              >
                {updateComment.isPending ? <Spinner className="size-3.5" /> : "수정"}
              </Button>
            </div>
          </div>
        ) : (
          <ClampedText
            expandable
            className="mt-1"
            textClassName="text-foreground/90 line-clamp-5 text-sm leading-relaxed wrap-break-word whitespace-pre-wrap"
          >
            <RichMessageText as="span" text={comment.content} />
          </ClampedText>
        )}

        {!isEditing && (
          <div className="mt-1.5 flex h-7 items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              {!isReply && (
                <button
                  type="button"
                  // 답글 쓰기는 열기 전용(접기는 "답글 N"으로). 답글이 없을 때만 토글로 닫을 수 있게 한다.
                  onClick={() => setRepliesOpen((open) => (comment.replyCount > 0 ? true : !open))}
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
                  답글 {formatNumber(comment.replyCount)}
                  <ChevronDown
                    className={cn("size-3.5 transition-transform", repliesOpen && "rotate-180")}
                  />
                </button>
              )}
            </div>

            <CommunityCommentLikeButton
              commentId={comment.id}
              viewerId={viewerId}
              authorId={comment.authorId}
              isLiked={comment.isLiked}
              likeCount={comment.likeCount}
            />
          </div>
        )}

        {!isReply && repliesOpen && (
          <CommunityCommentReplies
            postId={postId}
            viewerId={viewerId}
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
            ? "삭제한 답글은 복구할 수 없어요."
            : "달린 답글도 함께 삭제되며 복구할 수 없어요."
        }
        isPending={deleteComment.isPending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
