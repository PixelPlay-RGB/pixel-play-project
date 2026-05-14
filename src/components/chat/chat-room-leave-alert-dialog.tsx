"use client";

// 채팅방 나가기 확인용 AlertDialog

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onConfirmLeave: () => void;
}

export function ChatRoomLeaveAlertDialog({
  open,
  onOpenChange,
  isPending,
  onConfirmLeave,
}: Props) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
      }}
    >
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>채팅방 나가기</AlertDialogTitle>
          <AlertDialogDescription>
            이 채팅방에서 나가면 참여 목록에서 제거됩니다. 다시 들어오려면 해당 채팅방에 다시
            참여해야 합니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            type="button"
            onClick={onConfirmLeave}
          >
            {isPending ? "나가는 중…" : "나가기"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
