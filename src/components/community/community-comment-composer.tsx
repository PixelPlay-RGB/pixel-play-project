"use client";
// 댓글/대댓글 작성 입력창입니다. 로그인 유저만 작성할 수 있습니다.

import { SendHorizontal } from "lucide-react";
import { useState } from "react";

import ChatEmojiPicker from "@/components/chat-room/chat-emoji-picker";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { COMMUNITY_COMMENT_CONTENT_MAX } from "@/constants/community/community";
import { useCreateCommunityComment } from "@/hooks/community/use-create-community-comment";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

interface Props {
  postId: string;
  // 있으면 대댓글 작성.
  parentId?: string;
  compact?: boolean;
  placeholder?: string;
  onSubmitted?: () => void;
}

export default function CommunityCommentComposer({
  postId,
  parentId,
  compact = false,
  placeholder,
  onSubmitted,
}: Props) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [content, setContent] = useState("");
  const createComment = useCreateCommunityComment(postId);

  if (!currentUserId) {
    return (
      <div className="border-border/60 bg-muted/30 text-muted-foreground rounded-2xl border px-4 py-6 text-center text-sm font-semibold">
        로그인 후 댓글을 남길 수 있어요.
      </div>
    );
  }

  const trimmedLength = content.trim().length;
  const isSubmittable = trimmedLength > 0 && content.length <= COMMUNITY_COMMENT_CONTENT_MAX;

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => (prev + emoji).slice(0, COMMUNITY_COMMENT_CONTENT_MAX));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isSubmittable || createComment.isPending) {
      return;
    }

    const value = content.trim();
    setContent("");

    const result = await createComment.mutateAsync({ content: value, parentId });
    if (result.success) {
      onSubmitted?.();
    } else {
      setContent(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <ChatEmojiPicker disabled={createComment.isPending} onEmojiSelect={handleEmojiSelect} />
      <Textarea
        value={content}
        maxLength={COMMUNITY_COMMENT_CONTENT_MAX}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
        placeholder={placeholder ?? (parentId ? "답글을 입력하세요." : "댓글을 입력하세요.")}
        aria-label={parentId ? "답글 입력" : "댓글 입력"}
        rows={1}
        className={cn(
          "flex-1 resize-none rounded-xl text-base leading-normal md:text-sm",
          compact ? "max-h-28 min-h-9" : "max-h-32 min-h-10",
        )}
      />
      <Button
        type="submit"
        size="icon-lg"
        variant="ghost"
        disabled={!isSubmittable || createComment.isPending}
        aria-label={parentId ? "답글 등록" : "댓글 등록"}
        className="text-brand hover:bg-brand/10 hover:text-brand shrink-0"
      >
        {createComment.isPending ? (
          <Spinner className="size-5" />
        ) : (
          <SendHorizontal className="size-5" />
        )}
      </Button>
    </form>
  );
}
