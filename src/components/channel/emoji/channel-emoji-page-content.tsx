"use client";
// 채널 이모지(구독티콘) 등록 화면. 그리드(드래그 정렬) + 추가/수정 공용 다이얼로그 + 삭제 확인.
// 추가/수정/삭제는 즉시 반영, 순서변경은 드래그 종료 시 자동 커밋(useChannelEmojis).

import { MoveHorizontal, Pencil, Plus, X } from "lucide-react";
import { Reorder } from "motion/react";
import Image from "next/image";
import { useState } from "react";

import { ChannelEmojiFormDialog } from "@/components/channel/emoji/channel-emoji-form-dialog";
import DeleteConfirmDialog from "@/components/common/delete-confirm-dialog";
import { SettingsPage } from "@/components/common/settings-page";
import { CHANNEL_EMOJI_LABEL, CHANNEL_EMOJI_MAX } from "@/constants/channel/channel-emoji";
import { useChannelEmojis } from "@/hooks/channel/use-channel-emojis";
import { cn } from "@/lib/utils";
import type { ChannelEmoji } from "@/types/channel/channel-emoji";

interface Props {
  initialEmojis: ChannelEmoji[];
}

export function ChannelEmojiPageContent({ initialEmojis }: Props) {
  const {
    emojis,
    addEmoji,
    isAdding,
    updateEmoji,
    isUpdating,
    deleteEmoji,
    isDeleting,
    setOrder,
    commitOrder,
    isCommittingOrder,
    canAddMore,
  } = useChannelEmojis(initialEmojis);

  // 추가/수정/삭제/순서커밋 중 하나라도 진행 중이면 조작을 잠가 상태 경합을 막는다.
  const busy = isAdding || isUpdating || isDeleting || isCommittingOrder;

  // 다이얼로그: null=닫힘, "add"=추가, ChannelEmoji=수정.
  const [formTarget, setFormTarget] = useState<ChannelEmoji | "add" | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ChannelEmoji | null>(null);

  const isEditing = formTarget !== null && formTarget !== "add";

  const handleSubmit = (formData: FormData) => {
    const close = (result: { success: boolean }) => {
      if (result.success) setFormTarget(null);
    };
    if (isEditing) {
      updateEmoji(formData, { onSuccess: close });
    } else {
      addEmoji(formData, { onSuccess: close });
    }
  };

  return (
    <SettingsPage
      kicker={CHANNEL_EMOJI_LABEL.kicker}
      title={CHANNEL_EMOJI_LABEL.title}
      description={CHANNEL_EMOJI_LABEL.description}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-foreground text-sm font-semibold">
            {CHANNEL_EMOJI_LABEL.countLabel}{" "}
            <span className="text-muted-foreground font-normal">
              {emojis.length} / {CHANNEL_EMOJI_MAX}
            </span>
          </span>
          <span className="text-muted-foreground text-xs">{CHANNEL_EMOJI_LABEL.spec}</span>
        </div>

        <div className="flex items-start gap-2 overflow-x-auto pb-1">
          <Reorder.Group
            as="ul"
            axis="x"
            values={emojis}
            onReorder={setOrder}
            className="flex items-start gap-2"
          >
            {emojis.map((emoji) => (
              <EmojiSlot
                key={emoji.id}
                emoji={emoji}
                disabled={busy}
                onEdit={() => setFormTarget(emoji)}
                onDelete={() => setPendingDelete(emoji)}
                onCommitOrder={() => void commitOrder()}
              />
            ))}
          </Reorder.Group>

          {canAddMore && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setFormTarget("add")}
              className="border-border hover:border-brand/50 text-muted-foreground flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed transition-colors disabled:opacity-60"
            >
              <Plus className="text-brand size-5" />
              <span className="text-xs font-semibold">{CHANNEL_EMOJI_LABEL.add}</span>
            </button>
          )}
        </div>

        {emojis.length > 1 && (
          <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
            <MoveHorizontal className="size-3.5" aria-hidden />
            {CHANNEL_EMOJI_LABEL.dragHint}
          </p>
        )}
      </div>

      <ChannelEmojiFormDialog
        target={formTarget}
        onClose={() => setFormTarget(null)}
        onSubmit={handleSubmit}
        isPending={isAdding || isUpdating}
      />

      <DeleteConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={CHANNEL_EMOJI_LABEL.deleteTitle}
        description={CHANNEL_EMOJI_LABEL.deleteDescription}
        isPending={isDeleting}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteEmoji(pendingDelete.id, {
            onSuccess: (result) => {
              if (result.success) setPendingDelete(null);
            },
          });
        }}
      />
    </SettingsPage>
  );
}

interface EmojiSlotProps {
  emoji: ChannelEmoji;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onCommitOrder: () => void;
}

function EmojiSlot({ emoji, disabled, onEdit, onDelete, onCommitOrder }: EmojiSlotProps) {
  return (
    <Reorder.Item
      value={emoji}
      dragListener={!disabled}
      onDragEnd={onCommitOrder}
      className={cn(
        "border-border bg-background relative flex size-20 shrink-0 flex-col items-center justify-center rounded-xl border p-1.5 select-none",
        disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing",
      )}
    >
      <button
        type="button"
        disabled={disabled}
        aria-label={`${emoji.name} 삭제`}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onDelete}
        className="text-muted-foreground hover:text-destructive absolute top-0.5 right-0.5 flex size-5 items-center justify-center rounded-full disabled:opacity-50"
      >
        <X className="size-3.5" />
      </button>

      <div className="relative size-9">
        <Image
          src={emoji.imageUrl}
          alt={emoji.name}
          fill
          sizes="36px"
          unoptimized
          draggable={false}
          className="object-contain"
        />
      </div>

      <div className="mt-1 flex max-w-full min-w-0 items-center gap-0.5">
        <span className="text-muted-foreground truncate text-xs font-medium">{emoji.name}</span>
        <button
          type="button"
          disabled={disabled}
          aria-label={`${emoji.name} 수정`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onEdit}
          className="text-muted-foreground hover:text-foreground shrink-0 disabled:opacity-50"
        >
          <Pencil className="size-3" />
        </button>
      </div>
    </Reorder.Item>
  );
}
