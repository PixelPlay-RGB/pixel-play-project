"use client";
// 채팅방 나가기 확인용 AlertDialog

import { DoorOpen, LogOut } from "lucide-react";

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
  isPending: boolean;
  isOwner: boolean;
  onConfirmLeave: () => void;
}

export function ChatRoomLeaveAlertDialog({
  open,
  onOpenChange,
  isPending,
  isOwner,
  onConfirmLeave,
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
            <LogOut />
          </AlertDialogMedia>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <AlertDialogTitle className="text-lg leading-tight font-bold">
              채팅방 나가기
            </AlertDialogTitle>
            <AlertDialogDescription className="leading-snug text-pretty whitespace-pre-line">
              {isOwner
                ? "채팅방에서 나가시겠습니까?\n방장이 나가면 채팅방과\n대화 기록이 함께 삭제됩니다."
                : "채팅방에서 나가시겠습니까?\n언제든 다시 참여하실 수 있습니다."}
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
            돌아가기
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            type="button"
            onClick={onConfirmLeave}
            className="shadow-destructive/10 h-10 min-w-24 rounded-xl px-4 font-bold shadow-sm"
          >
            {isPending ? (
              <Spinner className="size-4" />
            ) : (
              <>
                <DoorOpen className="size-4" />
                나가기
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
