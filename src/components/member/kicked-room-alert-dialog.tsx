"use client";

// 강퇴당한 유저에게 알림을 표시하고 메인으로 이동시키는 Dialog
import { useRouter } from "next/navigation";
import { DoorOpen, UserX } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  open: boolean;
}

export function KickedRoomAlertDialog({ open }: Props) {
  const router = useRouter();

  const handleConfirm = () => {
    router.replace("/");
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <UserX />
          </AlertDialogMedia>
          <AlertDialogTitle>채팅방 강퇴</AlertDialogTitle>
          <AlertDialogDescription>
            방장에 의해 채팅방에서 제외되었습니다.
            <br />더 이상 이 방에서 대화를 나눌 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleConfirm} className="sm:w-32" variant="destructive">
            <DoorOpen className="mr-2 size-4" />
            나가기
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
