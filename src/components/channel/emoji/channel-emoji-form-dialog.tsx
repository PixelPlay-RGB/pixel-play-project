"use client";
// 채널 이모지 추가/수정 공용 다이얼로그. 이미지(PNG) 업로드 + 이름 입력 → 등록/저장.
// target: null=닫힘, "add"=추가, ChannelEmoji=수정(기존 이미지·이름으로 채워 열림).
// 업로드한 이미지가 "이모지 목록"·"채팅"에서 각각 어떻게 보이는지 실크기로 미리 보여준다.

import { Camera, ImagePlus } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import StickerImage from "@/components/sticker/sticker-image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  CHANNEL_EMOJI_ACCEPT,
  CHANNEL_EMOJI_ALLOWED_TYPES,
  CHANNEL_EMOJI_LABEL,
  CHANNEL_EMOJI_MAX_SIZE,
  CHANNEL_EMOJI_NAME_MAX,
} from "@/constants/channel/channel-emoji";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { STICKER_PX } from "@/constants/sticker/sticker";
import type { ChannelEmoji } from "@/types/channel/channel-emoji";
import { toastAppError } from "@/utils/common/toast-message";

interface Props {
  target: ChannelEmoji | "add" | null;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
}

export function ChannelEmojiFormDialog({ target, onClose, onSubmit, isPending }: Props) {
  const isEdit = target !== null && target !== "add";
  const [file, setFile] = useState<File | null>(null);
  // 새로 고른 이미지의 blob URL(있을 때만). 기존(remote) URL은 revoke 대상이 아니다.
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // target이 바뀌면(열림/수정 대상 변경) 폼 상태를 초기화한다 — 렌더 중 직접 조정(effect 불필요).
  // 이전 blob URL 정리는 아래 [objectUrl] cleanup이 objectUrl 변경 시 처리한다.
  const [renderedTarget, setRenderedTarget] = useState(target);
  if (target !== renderedTarget) {
    setRenderedTarget(target);
    setFile(null);
    setObjectUrl(null);
    setName(isEdit ? target.name : "");
  }

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const previewSrc = objectUrl ?? (isEdit ? target.imageUrl : null);
  const trimmedName = name.trim();

  // 미리보기 렌더용 — StickerImage가 받는 Sticker 형태로 변환(blob/remote URL 모두 동작).
  const previewSticker = previewSrc
    ? {
        id: "preview",
        label: trimmedName || CHANNEL_EMOJI_LABEL.title,
        src: previewSrc,
        isAnimated: false,
      }
    : null;

  const handleSelectFile = (next: File | null) => {
    if (!next) return;
    if (!CHANNEL_EMOJI_ALLOWED_TYPES.includes(next.type)) {
      toastAppError(APP_MESSAGE_CODE.error.channel.emojiSaveFailed);
      return;
    }
    if (next.size > CHANNEL_EMOJI_MAX_SIZE) {
      toastAppError(APP_MESSAGE_CODE.error.channel.emojiImageTooLarge);
      return;
    }
    setObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(next);
    });
    setFile(next);
  };

  // 추가는 이미지 필수, 수정은 이미지 선택(미선택 시 기존 유지).
  const canSubmit = trimmedName.length > 0 && (isEdit || !!file) && !isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const formData = new FormData();
    formData.append("name", trimmedName);
    if (file) formData.append("file", file);
    if (isEdit) formData.append("emojiId", target.id);
    onSubmit(formData);
  };

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? CHANNEL_EMOJI_LABEL.editTitle : CHANNEL_EMOJI_LABEL.addTitle}
          </DialogTitle>
          <DialogDescription>{CHANNEL_EMOJI_LABEL.addDescription}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* 업로드 영역 — 큼직한 드롭존 + 카메라 배지(클릭해 변경) */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => inputRef.current?.click()}
            aria-label={isEdit ? CHANNEL_EMOJI_LABEL.changeImage : CHANNEL_EMOJI_LABEL.uploadTitle}
            className="border-border hover:border-brand/60 hover:bg-brand/5 bg-muted/30 group relative flex h-36 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed transition-colors disabled:opacity-60"
          >
            {previewSrc ? (
              <>
                <div className="relative size-20">
                  <Image
                    src={previewSrc}
                    alt=""
                    fill
                    sizes="80px"
                    unoptimized
                    draggable={false}
                    className="object-contain"
                  />
                </div>
                <span className="bg-brand text-brand-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
                  <Camera className="size-3.5" />
                  {CHANNEL_EMOJI_LABEL.changeImage}
                </span>
              </>
            ) : (
              <>
                <div className="bg-brand/10 text-brand flex size-12 items-center justify-center rounded-2xl">
                  <ImagePlus className="size-6" />
                </div>
                <div className="text-center">
                  <p className="text-foreground text-sm font-semibold">
                    {CHANNEL_EMOJI_LABEL.uploadTitle}
                  </p>
                  <p className="text-muted-foreground text-xs">{CHANNEL_EMOJI_LABEL.uploadHint}</p>
                </div>
              </>
            )}
          </button>

          {/* 실사용 미리보기 — 이미지가 있을 때만(이모지 목록 크기 + 채팅 인라인 크기) */}
          {previewSticker && (
            <div className="grid grid-cols-2 gap-2">
              <div className="border-border bg-muted/30 flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3">
                <StickerImage sticker={previewSticker} px={STICKER_PX.overlay} />
                <span className="text-muted-foreground text-[11px]">
                  {CHANNEL_EMOJI_LABEL.pickerPreviewLabel}
                </span>
              </div>
              <div className="border-border bg-muted/30 flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3">
                <span className="text-foreground inline-flex items-center gap-1 text-sm">
                  <span className="text-brand font-bold">
                    {CHANNEL_EMOJI_LABEL.previewChatNickname}
                  </span>
                  <StickerImage sticker={previewSticker} px={STICKER_PX.inline} />
                </span>
                <span className="text-muted-foreground text-[11px]">
                  {CHANNEL_EMOJI_LABEL.inChatPreviewLabel}
                </span>
              </div>
            </div>
          )}

          {/* 이름 */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="channel-emoji-name" className="text-foreground text-sm font-semibold">
                {CHANNEL_EMOJI_LABEL.nameLabel}
              </label>
              <span className="text-muted-foreground text-xs tabular-nums">
                {trimmedName.length} / {CHANNEL_EMOJI_NAME_MAX}
              </span>
            </div>
            <Input
              id="channel-emoji-name"
              value={name}
              disabled={isPending}
              maxLength={CHANNEL_EMOJI_NAME_MAX}
              placeholder={CHANNEL_EMOJI_LABEL.namePlaceholder}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.nativeEvent.isComposing) return;
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={CHANNEL_EMOJI_ACCEPT}
          className="hidden"
          onChange={(event) => {
            handleSelectFile(event.target.files?.[0] ?? null);
            event.target.value = "";
          }}
        />

        <DialogFooter>
          <Button type="button" variant="outline" disabled={isPending} onClick={onClose}>
            {CHANNEL_EMOJI_LABEL.cancel}
          </Button>
          <Button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="bg-brand hover:bg-brand/85 text-brand-foreground font-bold"
          >
            {isPending ? (
              <Spinner className="size-4" />
            ) : isEdit ? (
              CHANNEL_EMOJI_LABEL.submitEdit
            ) : (
              CHANNEL_EMOJI_LABEL.submitAdd
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
