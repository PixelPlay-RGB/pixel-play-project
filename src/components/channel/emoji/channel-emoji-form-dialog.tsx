"use client";
// 채널 이모지 추가/수정 공용 다이얼로그. 이미지(PNG) 업로드 + 이름 입력 → 등록/저장.
// target: null=닫힘, "add"=추가, ChannelEmoji=수정(기존 이미지·이름으로 채워 열림).

import { Camera, ImagePlus } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

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

  const trimmedName = name.trim();
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
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? CHANNEL_EMOJI_LABEL.editTitle : CHANNEL_EMOJI_LABEL.addTitle}
          </DialogTitle>
          <DialogDescription>{CHANNEL_EMOJI_LABEL.spec}</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-1">
          <button
            type="button"
            disabled={isPending}
            onClick={() => inputRef.current?.click()}
            aria-label={isEdit ? CHANNEL_EMOJI_LABEL.changeImage : CHANNEL_EMOJI_LABEL.uploadHint}
            className="border-border hover:border-brand/50 bg-muted/40 relative flex size-20 items-center justify-center overflow-hidden rounded-xl border transition-colors disabled:opacity-60"
          >
            {previewSrc ? (
              <Image
                src={previewSrc}
                alt=""
                fill
                sizes="80px"
                unoptimized
                draggable={false}
                className="object-contain p-1.5"
              />
            ) : (
              <ImagePlus className="text-muted-foreground size-7" />
            )}
            <span className="bg-brand text-brand-foreground border-background absolute right-0 bottom-0 flex size-6 items-center justify-center rounded-full border-2">
              <Camera className="size-3.5" />
            </span>
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="channel-emoji-name" className="text-muted-foreground text-sm">
            {CHANNEL_EMOJI_LABEL.nameLabel}
          </label>
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
