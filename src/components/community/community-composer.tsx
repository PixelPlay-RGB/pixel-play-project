"use client";
// 게시글 작성·수정 겸용 폼. 별도 수정 화면 없이 같은 폼을 재사용합니다.

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import ChatEmojiPicker from "@/components/chat-room/chat-emoji-picker";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { COMMUNITY_POST_CONTENT_MAX } from "@/constants/community/community";
import { useCreateCommunityPost } from "@/hooks/community/use-create-community-post";
import { useUpdateCommunityPost } from "@/hooks/community/use-update-community-post";
import { cn } from "@/lib/utils";

interface Props {
  creatorId: string;
  postId?: string;
  initialContent?: string;
}

export default function CommunityComposer({ creatorId, postId, initialContent = "" }: Props) {
  const router = useRouter();
  const isEdit = Boolean(postId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState(initialContent);

  const createPost = useCreateCommunityPost();
  const updatePost = useUpdateCommunityPost(postId ?? "");
  const isPending = createPost.isPending || updatePost.isPending;

  const trimmedLength = content.trim().length;
  const isSubmittable = trimmedLength > 0 && content.length <= COMMUNITY_POST_CONTENT_MAX;

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => (prev + emoji).slice(0, COMMUNITY_POST_CONTENT_MAX));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isSubmittable || isPending) {
      return;
    }

    const value = content.trim();

    if (isEdit && postId) {
      const result = await updatePost.mutateAsync(value);
      if (result.success) {
        router.push(`/channel/${creatorId}/community/${postId}`);
      }
      return;
    }

    const result = await createPost.mutateAsync(value);
    if (result.success && result.data) {
      router.push(`/channel/${creatorId}/community/${result.data.postId}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Textarea
        ref={textareaRef}
        value={content}
        maxLength={COMMUNITY_POST_CONTENT_MAX}
        onChange={(event) => setContent(event.target.value)}
        placeholder="팔로워에게 전할 소식을 남겨보세요."
        aria-label="게시글 내용"
        className="min-h-48 resize-none rounded-2xl text-base leading-relaxed md:text-sm"
      />

      <div className="flex items-center justify-between gap-2">
        <ChatEmojiPicker disabled={isPending} onEmojiSelect={handleEmojiSelect} />

        <div className="flex items-center gap-3">
          <span
            className={cn(
              "text-muted-foreground text-xs font-semibold tabular-nums",
              content.length > COMMUNITY_POST_CONTENT_MAX && "text-destructive",
            )}
          >
            {content.length.toLocaleString("ko-KR")} /{" "}
            {COMMUNITY_POST_CONTENT_MAX.toLocaleString("ko-KR")}
          </span>

          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={() =>
              router.push(
                isEdit && postId
                  ? `/channel/${creatorId}/community/${postId}`
                  : `/channel/${creatorId}/community`,
              )
            }
            className="h-9 rounded-xl px-4 text-sm font-semibold"
          >
            취소
          </Button>

          <Button
            type="submit"
            disabled={!isSubmittable || isPending}
            className="bg-brand hover:bg-brand/85 h-9 rounded-xl px-5 text-sm font-bold text-white"
          >
            {isPending ? <Spinner className="size-4" /> : isEdit ? "수정 완료" : "등록"}
          </Button>
        </div>
      </div>
    </form>
  );
}
