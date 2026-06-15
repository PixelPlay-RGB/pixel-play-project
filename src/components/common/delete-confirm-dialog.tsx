"use client";
// 공용 삭제 확인 다이얼로그 — 공통 destructive 배너 셸(DestructiveAlertDialog)을 쓴다.
// 게시글·댓글·배너 등 삭제 확인에 재사용. 푸터만 [취소][삭제] 버튼으로 채운다.

import { Trash2 } from "lucide-react";

import { DestructiveAlertDialog } from "@/components/common/destructive-alert-dialog";
import { AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  isPending: boolean;
  onConfirm: () => void;
  confirmLabel?: string;
}

export default function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  isPending,
  onConfirm,
  confirmLabel = "삭제",
}: Props) {
  return (
    <DestructiveAlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
      }}
      icon={<Trash2 />}
      title={title}
      description={description}
      descriptionClassName="whitespace-pre-line"
      footerClassName="flex-row gap-2"
    >
      <AlertDialogCancel
        disabled={isPending}
        className="border-border bg-background text-foreground hover:bg-muted h-10 min-w-24 rounded-xl px-4 font-semibold"
      >
        취소
      </AlertDialogCancel>
      <AlertDialogAction
        variant="destructive"
        disabled={isPending}
        type="button"
        onClick={onConfirm}
        className="shadow-destructive/10 h-10 min-w-24 rounded-xl px-4 font-bold shadow-sm"
      >
        {isPending ? <Spinner className="size-4" /> : confirmLabel}
      </AlertDialogAction>
    </DestructiveAlertDialog>
  );
}
