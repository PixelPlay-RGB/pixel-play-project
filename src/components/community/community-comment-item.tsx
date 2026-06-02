"use client";
// 댓글 단건. 본인 댓글은 인라인 수정, 본인/채널주인은 삭제할 수 있습니다.

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

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
}

export default function CommunityCommentItem({ postId, comment, isChannelOwner }: Props) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const updateComment = useUpdateCommunityComment(postId);
  const deleteComment = useDeleteCommunityComment(postId);

  const isAuthor = currentUserId === comment.authorId;
  const canEdit = isAuthor;
  const canDelete = isAuthor || isChannelOwner;
  const isOptimistic = comment.id.startsWith("optimistic-");

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
    <div className="flex gap-3 py-3">
      <Avatar className="size-9 shrink-0">
        <AvatarImage
          src={getAvatarImageSrc(comment.authorPhotoUrl)}
          alt={`${comment.authorNickname}의 프로필 사진`}
        />
        <AvatarFallback className="text-xs font-black">
          {getAvatarFallbackText(comment.authorNickname, 1)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-foreground truncate text-sm font-bold">
            {comment.authorNickname}
          </span>
          <span className="text-muted-foreground shrink-0 text-xs">
            {formatRelativeTime(comment.createdAt)}
            {comment.modifiedAt && " · 수정됨"}
          </span>
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
          <p className="text-foreground/90 mt-1 text-sm leading-relaxed break-words whitespace-pre-wrap">
            {comment.content}
          </p>
        )}

        {!isEditing && !isOptimistic && (canEdit || canDelete) && (
          <div className="mt-1.5 flex items-center gap-1">
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setDraft(comment.content);
                  setIsEditing(true);
                }}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-semibold"
              >
                <Pencil className="size-3" />
                수정
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => setIsDeleteOpen(true)}
                className={cn(
                  "text-muted-foreground hover:text-destructive inline-flex items-center gap-1 text-xs font-semibold",
                  canEdit &&
                    "before:bg-border before:mx-1.5 before:h-3 before:w-px before:content-['']",
                )}
              >
                <Trash2 className="size-3" />
                삭제
              </button>
            )}
          </div>
        )}
      </div>

      <AlertDialog
        open={isDeleteOpen}
        onOpenChange={(next) => {
          if (!deleteComment.isPending) setIsDeleteOpen(next);
        }}
      >
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>댓글 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 댓글을 삭제할까요? 삭제한 댓글은 복구할 수 없어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteComment.isPending}>취소</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              type="button"
              disabled={deleteComment.isPending}
              onClick={handleConfirmDelete}
            >
              {deleteComment.isPending ? <Spinner className="size-4" /> : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
