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
      <AlertDialogContent
        showCloseButton={false}
        className="border-destructive/20 shadow-destructive/10 overflow-hidden rounded-2xl p-0 shadow-xl sm:max-w-md"
      >
        <AlertDialogHeader className="bg-destructive/5 border-destructive/10 border-b px-5 pt-5 pb-4 text-left">
          <AlertDialogMedia className="bg-destructive/10 text-destructive ring-destructive/20 mb-0 rounded-xl ring-1">
            <UserX />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-lg font-bold">채팅방 강퇴</AlertDialogTitle>
          <AlertDialogDescription className="leading-relaxed text-pretty">
            방장에 의해 채팅방에서 제외되었습니다.
            <br />더 이상 이 방에서 대화를 나눌 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="m-0 flex-row justify-end border-0 bg-transparent px-5 pt-4 pb-5">
          <AlertDialogAction
            onClick={handleConfirm}
            className="shadow-destructive/10 h-10 min-w-32 rounded-xl font-bold shadow-sm"
            variant="destructive"
          >
            <DoorOpen className="mr-2 size-4" />
            나가기
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
