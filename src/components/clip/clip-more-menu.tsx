"use client";
// 클립 더보기(⋮ vertical-ellipsis) 메뉴 — Popover 안에 (디테일 전용)엠비언트 토글 + (권한 시)삭제를
// 묶는다. 채널 클립 카드와 디테일 쇼츠 레일에서 공용으로 쓴다. 삭제는 권한 RPC 경유 액션 + 확인
// 다이얼로그 + 채널 클립 목록 캐시 무효화. 보일 항목이 없으면(권한 없고 엠비언트도 없음) 렌더 안 함.

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, MoreVertical, Sparkles, Trash2 } from "lucide-react";

import { deleteLiveClipAction } from "@/actions/clip/clip";
import DeleteConfirmDialog from "@/components/common/delete-confirm-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { CLIP_LABEL } from "@/constants/clip/clip";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { cn } from "@/lib/utils";
import type { LiveClip } from "@/types/clip/clip";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";

interface Props {
  clip: LiveClip;
  // 로그인 뷰어 id — 클립 제작자(clipper) 또는 채널 주인(creator)일 때만 삭제 항목 노출.
  viewerId: string | null;
  // 디테일 전용 — 엠비언트 토글을 메뉴에 함께 넣는다(채널 카드에선 생략).
  ambient?: { active: boolean; onToggle: () => void };
  triggerClassName?: string;
  iconClassName?: string;
  triggerAriaLabel?: string;
  side?: "left" | "right" | "top" | "bottom";
  // 삭제 성공 후(목록 무효화 직전) 추가 처리 — 디테일은 캐러셀을 인접 클립으로 옮긴다.
  onDeleted?: () => void;
}

const MENU_ITEM_CLASS =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-muted";

export function ClipMoreMenu({
  clip,
  viewerId,
  ambient,
  triggerClassName,
  iconClassName = "size-5",
  triggerAriaLabel = "더보기",
  side = "left",
  onDeleted,
}: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canDelete = !!viewerId && (viewerId === clip.clipperUserId || viewerId === clip.creatorId);

  // 보일 항목이 하나도 없으면 트리거 자체를 숨긴다.
  if (!ambient && !canDelete) return null;

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      const result = await deleteLiveClipAction(clip.id);

      if (result.success) {
        toastAppSuccess(APP_MESSAGE_CODE.success.clip.deleted);
        setDeleteOpen(false);
        // 디테일은 삭제한 클립에서 먼저 벗어난 뒤(onDeleted) 목록 캐시를 무효화한다.
        onDeleted?.();
        void queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.clip.channelAll(clip.creatorId),
        });
      } else {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.clip.deleteFailed);
      }
    } finally {
      // 예외로 빠져나가도 다이얼로그가 영구 pending에 갇히지 않게 보장한다.
      setDeleting(false);
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button type="button" aria-label={triggerAriaLabel} className={triggerClassName}>
              <MoreVertical className={iconClassName} aria-hidden />
            </button>
          }
        />
        <PopoverContent side={side} align="center" className="flex w-44 flex-col gap-0.5 p-1">
          {ambient ? (
            // 토글은 메뉴를 닫지 않는다 — 체크 표시가 바로 바뀌는 걸 보여준다.
            <button type="button" className={MENU_ITEM_CLASS} onClick={ambient.onToggle}>
              <Sparkles
                className={cn("size-4 shrink-0", ambient.active && "text-brand")}
                aria-hidden
              />
              <span className="flex-1 text-left">{CLIP_LABEL.ambient}</span>
              {ambient.active ? <Check className="text-brand size-4 shrink-0" aria-hidden /> : null}
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              className={cn(MENU_ITEM_CLASS, "text-destructive hover:bg-destructive/10")}
              onClick={() => {
                setOpen(false);
                setDeleteOpen(true);
              }}
            >
              <Trash2 className="size-4 shrink-0" aria-hidden />
              <span className="flex-1 text-left">{CLIP_LABEL.delete}</span>
            </button>
          ) : null}
        </PopoverContent>
      </Popover>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={CLIP_LABEL.deleteTitle}
        description={CLIP_LABEL.deleteDescription}
        isPending={deleting}
        onConfirm={() => void handleDelete()}
        confirmLabel={CLIP_LABEL.delete}
      />
    </>
  );
}
