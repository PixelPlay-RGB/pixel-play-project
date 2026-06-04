"use client";
// 공용 삭제 확인 다이얼로그(프로젝트 배너 헤더 컨벤션). 게시글·댓글·배너 등 삭제 확인에 재사용.

import { Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

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
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
      }}
    >
      <AlertDialogContent
        showCloseButton={false}
        className={cn(
          "overflow-hidden rounded-2xl p-0 shadow-xl sm:max-w-md",
          "border-destructive/20 shadow-destructive/10",
        )}
      >
        <AlertDialogHeader
          className={cn(
            "flex items-center gap-4 border-b px-5 pt-5 pb-4 text-left",
            "bg-destructive/5 border-destructive/10",
          )}
        >
          <AlertDialogMedia
            className={cn(
              "mb-0 shrink-0 rounded-xl ring-1",
              "bg-destructive/10 text-destructive ring-destructive/20",
            )}
          >
            <Trash2 />
          </AlertDialogMedia>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <AlertDialogTitle className="text-lg leading-tight font-bold">{title}</AlertDialogTitle>
            <AlertDialogDescription className="leading-snug text-pretty whitespace-pre-line">
              {description}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="m-0 flex-row justify-end gap-2 border-0 bg-transparent px-5 pt-4 pb-5">
          <AlertDialogCancel
            disabled={isPending}
            className={cn(
              "h-10 min-w-24 rounded-xl px-4 font-semibold",
              "border-border bg-background text-foreground hover:bg-muted",
            )}
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
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
