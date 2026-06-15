"use client";
// 댓글/대댓글 작성 입력창. 텍스트영역 + 하단 한 줄(이모지·글자수·등록). 로그인 유저만 작성.

import { SendHorizontal } from "lucide-react";
import { useRef, useState } from "react";

import RichEmojiInput from "@/components/common/rich-emoji-input";
import StickerPicker from "@/components/sticker/sticker-picker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { COMMUNITY_COMMENT_CONTENT_MAX } from "@/constants/community/community";
import { useCreateCommunityComment } from "@/hooks/community/use-create-community-comment";
import { useNullableUser } from "@/hooks/profile/use-profile";
import { cn } from "@/lib/utils";
import { useViewerId } from "@/hooks/common/use-viewer-id";
import { formatNumber } from "@/utils/common/format";
import { appendStickerToken } from "@/utils/sticker/sticker-token";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";

interface Props {
  postId: string;
  // 서버에서 확인한 시청자 id(비로그인 null). 인증 게이팅의 1차 기준.
  viewerId: string | null;
  // 있으면 대댓글 작성.
  parentId?: string;
  compact?: boolean;
  placeholder?: string;
  onSubmitted?: () => void;
}

export default function CommunityCommentComposer({
  postId,
  viewerId,
  parentId,
  compact = false,
  placeholder,
  onSubmitted,
}: Props) {
  const currentUserId = useViewerId(viewerId);
  const { data: profile } = useNullableUser();
  const [content, setContent] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const createComment = useCreateCommunityComment(postId);

  if (!currentUserId) {
    return (
      <div className="border-border/60 bg-muted/30 text-muted-foreground rounded-2xl border px-4 py-6 text-center text-sm font-semibold">
        로그인 후 댓글을 남길 수 있어요.
      </div>
    );
  }

  const overLimit = content.length > COMMUNITY_COMMENT_CONTENT_MAX;
  const trimmedLength = content.trim().length;
  const isSubmittable = trimmedLength > 0 && !overLimit;

  const handleStickerSelect = (token: string) => {
    setContent((prev) => appendStickerToken(prev, token, COMMUNITY_COMMENT_CONTENT_MAX));
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
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="border-border/60 focus-within:border-brand/40 bg-muted/40 flex flex-col gap-2 rounded-2xl border p-3 transition-colors"
    >
      <div className="flex gap-2.5">
        <Avatar className={cn("mt-0.5 shrink-0", compact ? "size-7" : "size-8")}>
          <AvatarImage src={getAvatarImageSrc(profile?.photo_url)} alt="내 프로필 사진" />
          <AvatarFallback className="text-xs font-black">
            {getAvatarFallbackText(profile?.nickname ?? "나", 1)}
          </AvatarFallback>
        </Avatar>
        <RichEmojiInput
          value={content}
          onChange={setContent}
          onSubmit={() => formRef.current?.requestSubmit()}
          submitOnEnter
          allowNewline
          placeholder={placeholder ?? (parentId ? "답글을 입력하세요." : "댓글을 입력하세요.")}
          maxLength={COMMUNITY_COMMENT_CONTENT_MAX}
          ariaLabel={parentId ? "답글 입력" : "댓글 입력"}
          className="min-h-8 flex-1 text-base leading-relaxed md:text-sm"
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-muted-foreground text-xs font-semibold tabular-nums",
            overLimit && "text-destructive",
          )}
        >
          {formatNumber(content.length)} / {formatNumber(COMMUNITY_COMMENT_CONTENT_MAX)}
        </span>

        {/* 이모지 피커를 전송 버튼 옆에 둔다. 위로 열면 입력칸을 가려 아래로 연다. */}
        <div className="flex items-center gap-1">
          <StickerPicker
            disabled={createComment.isPending}
            onStickerSelect={handleStickerSelect}
            side="bottom"
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
        </div>
      </div>
    </form>
  );
}
