"use client";
// 게시글 작성·수정 겸용 폼. 별도 수정 화면 없이 같은 폼을 재사용합니다.

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ImagePlus, X } from "lucide-react";

import ChatEmojiPicker from "@/components/common/chat-emoji-picker";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import {
  COMMUNITY_IMAGE_ALLOWED_TYPES,
  COMMUNITY_IMAGE_MAX_SIZE,
  COMMUNITY_POST_CONTENT_MAX,
} from "@/constants/community/community";
import { formatNumber } from "@/utils/common/format";
import { useCreateCommunityPost } from "@/hooks/community/use-create-community-post";
import { useUpdateCommunityPost } from "@/hooks/community/use-update-community-post";
import { cn } from "@/lib/utils";
import { toastAppError } from "@/utils/common/toast-message";

interface Props {
  creatorId: string;
  postId?: string;
  initialContent?: string;
  initialImageUrl?: string | null;
}

const IMAGE_ACCEPT = COMMUNITY_IMAGE_ALLOWED_TYPES.join(",");

export default function CommunityComposer({
  creatorId,
  postId,
  initialContent = "",
  initialImageUrl = null,
}: Props) {
  const router = useRouter();
  const isEdit = Boolean(postId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState(initialContent);

  // 이미지 상태: 새로 선택한 파일(+blob 미리보기) / 기존 이미지 제거 여부.
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newPreview, setNewPreview] = useState<string | null>(null);
  const [removedExisting, setRemovedExisting] = useState(false);
  const [previewDim, setPreviewDim] = useState<{ width: number; height: number } | null>(null);

  const createPost = useCreateCommunityPost();
  const updatePost = useUpdateCommunityPost(postId ?? "");
  const isPending = createPost.isPending || updatePost.isPending;

  // 표시할 이미지: 새 파일 > (제거 안 했으면) 기존 > 없음.
  const displayImage = newPreview ?? (removedExisting ? null : initialImageUrl);

  useEffect(() => {
    return () => {
      if (newPreview) URL.revokeObjectURL(newPreview);
    };
  }, [newPreview]);

  const setFile = (file: File | null) => {
    setNewPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    setNewFile(file);
    setPreviewDim(null);
  };

  const handleSelectFile = (file: File | null) => {
    if (isPending || !file) return;
    if (!COMMUNITY_IMAGE_ALLOWED_TYPES.includes(file.type)) {
      toastAppError(APP_MESSAGE_CODE.error.community.postImageUploadFailed);
      return;
    }
    if (file.size > COMMUNITY_IMAGE_MAX_SIZE) {
      toastAppError(APP_MESSAGE_CODE.error.community.postImageTooLarge);
      return;
    }
    setFile(file);
    setRemovedExisting(false);
  };

  const handleRemoveImage = () => {
    if (isPending) return;
    setFile(null);
    setRemovedExisting(true);
  };

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
      const imageMode: "keep" | "replace" | "remove" = newFile
        ? "replace"
        : removedExisting && initialImageUrl
          ? "remove"
          : "keep";
      const result = await updatePost.mutateAsync({ content: value, imageMode, image: newFile });
      if (result.success) {
        router.push(`/channel/${creatorId}/community/${postId}`);
      }
      return;
    }

    const result = await createPost.mutateAsync({ content: value, image: newFile });
    if (result.success && result.data) {
      router.push(`/channel/${creatorId}/community/${result.data.postId}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {/* Textarea + 첨부 이미지 미리보기를 한 박스로 묶어 입력 영역에 포함되게 한다. */}
      <div className="border-border bg-muted/40 focus-within:border-brand/50 focus-within:ring-brand/20 flex flex-col gap-3 rounded-2xl border p-3 transition-colors focus-within:ring-3">
        <Textarea
          value={content}
          maxLength={COMMUNITY_POST_CONTENT_MAX}
          onChange={(event) => setContent(event.target.value)}
          placeholder="팔로워에게 전할 소식을 남겨보세요."
          aria-label="게시글 내용"
          className="min-h-40 resize-none border-0 bg-transparent p-0 text-base leading-relaxed shadow-none focus-visible:ring-0 disabled:bg-transparent md:text-sm dark:bg-transparent dark:disabled:bg-transparent"
        />

        {displayImage && (
          <div className="relative w-fit">
            <Image
              src={displayImage}
              alt="첨부 이미지 미리보기"
              width={previewDim?.width ?? 200}
              height={previewDim?.height ?? 200}
              onLoad={(event) =>
                setPreviewDim({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight,
                })
              }
              unoptimized
              className="border-border h-auto max-h-60 w-auto max-w-full rounded-xl border"
            />
            <button
              type="button"
              disabled={isPending}
              onClick={handleRemoveImage}
              aria-label="이미지 제거"
              className="bg-foreground/80 text-background hover:bg-foreground absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full transition-colors disabled:opacity-50"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <ChatEmojiPicker disabled={isPending} onEmojiSelect={handleEmojiSelect} />
          {!displayImage && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isPending}
              onClick={() => fileInputRef.current?.click()}
              aria-label="이미지 첨부"
              className="text-muted-foreground hover:text-foreground"
            >
              <ImagePlus className="size-5" />
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            className="hidden"
            onChange={(event) => {
              handleSelectFile(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />
        </div>

        <div className="flex items-center gap-3">
          <span
            className={cn(
              "text-muted-foreground text-xs font-semibold tabular-nums",
              content.length > COMMUNITY_POST_CONTENT_MAX && "text-destructive",
            )}
          >
            {formatNumber(content.length)} /{" "}
            {formatNumber(COMMUNITY_POST_CONTENT_MAX)}
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
