"use client";
// 채널 이모지(구독티콘) 등록 화면. 채팅 설정 라우터(2단: 좌측 메인 카드 스택 / 우측 SideTipCard)와
// 레이아웃 결을 맞춘다. 좌측 = "등록한 이모지" 관리 리스트(드래그 핸들 + 행별 수정/삭제) + 그 아래
// 구독자 미리보기, 우측 = 사용 팁. 추가/수정/삭제는 즉시 반영, 순서변경은 드래그 종료 시 자동 커밋.

import { GripVertical, Pencil, Plus, Smile, X } from "lucide-react";
import { Reorder, useDragControls } from "motion/react";
import Image from "next/image";
import { useState } from "react";

import { ChannelEmojiFormDialog } from "@/components/channel/emoji/channel-emoji-form-dialog";
import { ChannelEmojiPickerPreview } from "@/components/channel/emoji/channel-emoji-picker-preview";
import DeleteConfirmDialog from "@/components/common/delete-confirm-dialog";
import { SettingsCard } from "@/components/common/settings-card";
import { SettingsPage } from "@/components/common/settings-page";
import { SideTipCard, SideTipStep } from "@/components/common/side-tip-card";
import { Button } from "@/components/ui/button";
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
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        {/* 좌측 — 관리 리스트 + 미리보기 */}
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <SettingsCard
            title={CHANNEL_EMOJI_LABEL.manageTitle}
            description={CHANNEL_EMOJI_LABEL.manageDescription}
          >
            <div className="flex flex-col gap-4">
              <EmojiCountMeta count={emojis.length} />

              {emojis.length === 0 ? (
                <EmptyState disabled={busy} onAdd={() => setFormTarget("add")} />
              ) : (
                <div className="flex flex-col gap-3">
                  <Reorder.Group
                    as="ul"
                    axis="y"
                    values={emojis}
                    onReorder={setOrder}
                    className="flex flex-col gap-2"
                  >
                    {emojis.map((emoji) => (
                      <EmojiRow
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
                      className="border-border text-muted-foreground hover:border-brand/50 hover:text-foreground flex h-12 items-center justify-center gap-1.5 rounded-xl border border-dashed text-sm font-semibold transition-colors disabled:opacity-60"
                    >
                      <Plus className="text-brand size-4" />
                      {CHANNEL_EMOJI_LABEL.add}
                    </button>
                  )}
                </div>
              )}

              <p className="text-muted-foreground text-xs">{CHANNEL_EMOJI_LABEL.spec}</p>
            </div>
          </SettingsCard>

          <ChannelEmojiPickerPreview emojis={emojis} />
        </div>

        {/* 우측 — 사용 팁 */}
        <div className="flex min-w-0 flex-col gap-5 xl:w-120 xl:shrink-0">
          <SideTipCard
            icon={<Smile className="size-5" />}
            title={CHANNEL_EMOJI_LABEL.tipTitle}
            description={CHANNEL_EMOJI_LABEL.tipDescription}
          >
            <SideTipStep
              number="1"
              title={CHANNEL_EMOJI_LABEL.tipStep1Title}
              description={CHANNEL_EMOJI_LABEL.tipStep1Desc}
            />
            <SideTipStep
              number="2"
              title={CHANNEL_EMOJI_LABEL.tipStep2Title}
              description={CHANNEL_EMOJI_LABEL.tipStep2Desc}
            />
            <SideTipStep
              number="3"
              title={CHANNEL_EMOJI_LABEL.tipStep3Title}
              description={CHANNEL_EMOJI_LABEL.tipStep3Desc}
            />
          </SideTipCard>
        </div>
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

// 등록 개수 표시 — 우상단 대신 관리 카드 안(제목 바로 아래)에 두고 진행 바로 한도를 함께 보여준다.
function EmojiCountMeta({ count }: { count: number }) {
  const ratio = Math.min(count / CHANNEL_EMOJI_MAX, 1);

  return (
    <div className="flex items-center gap-3">
      <div className="bg-muted h-1.5 min-w-0 flex-1 overflow-hidden rounded-full">
        <div
          className="bg-brand h-full rounded-full transition-[width]"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <span className="text-foreground shrink-0 text-sm font-bold tabular-nums">
        {count}
        <span className="text-muted-foreground font-medium"> / {CHANNEL_EMOJI_MAX}</span>
      </span>
    </div>
  );
}

function EmptyState({ disabled, onAdd }: { disabled: boolean; onAdd: () => void }) {
  return (
    <div className="border-border/70 flex flex-col items-center gap-3 rounded-xl border border-dashed py-10 text-center">
      <div className="bg-brand/10 text-brand flex size-12 items-center justify-center rounded-2xl">
        <Smile className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="text-foreground text-sm font-semibold">{CHANNEL_EMOJI_LABEL.empty}</p>
        <p className="text-muted-foreground text-xs">{CHANNEL_EMOJI_LABEL.emptyHint}</p>
      </div>
      <Button
        type="button"
        disabled={disabled}
        onClick={onAdd}
        className="bg-brand hover:bg-brand/85 text-brand-foreground mt-1 h-10 rounded-xl px-5 font-bold"
      >
        <Plus className="size-4" />
        {CHANNEL_EMOJI_LABEL.add}
      </Button>
    </div>
  );
}

interface EmojiRowProps {
  emoji: ChannelEmoji;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onCommitOrder: () => void;
}

function EmojiRow({ emoji, disabled, onEdit, onDelete, onCommitOrder }: EmojiRowProps) {
  // 드래그는 핸들로만 시작한다(행 전체가 아니라) — 수정·삭제 버튼 클릭이 드래그로 새지 않게.
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      as="li"
      value={emoji}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onCommitOrder}
      className="border-border bg-background flex items-center gap-3 rounded-xl border p-2 select-none"
    >
      <button
        type="button"
        disabled={disabled}
        aria-label="순서 변경 핸들"
        onPointerDown={(event) => {
          if (disabled) return;
          dragControls.start(event);
        }}
        className={cn(
          "text-muted-foreground hover:text-foreground flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
          disabled ? "cursor-default opacity-50" : "cursor-grab touch-none active:cursor-grabbing",
        )}
      >
        <GripVertical className="size-4" />
      </button>

      <div className="bg-muted/40 border-border/60 relative size-11 shrink-0 overflow-hidden rounded-lg border">
        <Image
          src={emoji.imageUrl}
          alt={emoji.name}
          fill
          sizes="44px"
          unoptimized
          draggable={false}
          className="object-contain p-1"
        />
      </div>

      {/* 이름 + 수정(연필)을 한 그룹으로 붙이고(flex-start), 그룹을 flex-1로 둬 삭제(X)는 우측 끝으로 민다. */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className="text-foreground min-w-0 truncate text-sm font-semibold">{emoji.name}</span>
        <button
          type="button"
          disabled={disabled}
          aria-label={`${emoji.name} 수정`}
          onClick={onEdit}
          className="text-muted-foreground hover:text-foreground hover:bg-muted flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-50"
        >
          <Pencil className="size-3.5" />
        </button>
      </div>

      <button
        type="button"
        disabled={disabled}
        aria-label={`${emoji.name} 삭제`}
        onClick={onDelete}
        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-50"
      >
        <X className="size-4" />
      </button>
    </Reorder.Item>
  );
}
