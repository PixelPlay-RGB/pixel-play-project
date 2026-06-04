"use client";
// 대댓글 목록(토글 시 지연 로드) + 대댓글 작성 폼.

import CommunityCommentComposer from "@/components/community/community-comment-composer";
import CommunityCommentItem from "@/components/community/community-comment-item";
import { Spinner } from "@/components/ui/spinner";
import { useCommunityCommentReplies } from "@/hooks/community/use-community-comment-replies";

interface Props {
  postId: string;
  parentId: string;
  isChannelOwner: boolean;
}

export default function CommunityCommentReplies({ postId, parentId, isChannelOwner }: Props) {
  const { data, isPending } = useCommunityCommentReplies(parentId, true);
  const replies = data ?? [];

  return (
    <div className="border-border/50 mt-2 ml-1 space-y-1 border-l-2 pl-3">
      {isPending ? (
        <div className="flex justify-center py-3">
          <Spinner className="text-muted-foreground size-4" />
        </div>
      ) : (
        replies.map((reply) => (
          <CommunityCommentItem
            key={reply.id}
            postId={postId}
            comment={reply}
            isChannelOwner={isChannelOwner}
            isReply
          />
        ))
      )}

      <div className="pt-1">
        <CommunityCommentComposer postId={postId} parentId={parentId} compact />
      </div>
    </div>
  );
}
