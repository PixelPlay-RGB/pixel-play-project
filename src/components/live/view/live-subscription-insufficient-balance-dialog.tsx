"use client";
// 라이브 구독 결제 시 포인트 부족 상태에서 충전 이동 여부를 확인합니다.

import { WalletCards } from "lucide-react";

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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorNickname: string;
  onConfirm: () => void;
}

export function LiveSubscriptionInsufficientBalanceDialog({
  open,
  onOpenChange,
  creatorNickname,
  onConfirm,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        showCloseButton={false}
        className="overflow-hidden rounded-2xl p-0 shadow-xl data-[size=default]:max-w-sm data-[size=default]:sm:max-w-md"
      >
        <AlertDialogHeader className="border-warning/10 bg-warning/5 flex items-center gap-4 border-b px-6 pt-6 pb-5 text-left sm:gap-5 sm:px-7">
          <AlertDialogMedia className="bg-warning/10 text-warning ring-warning/20 mb-0 size-12 shrink-0 rounded-xl ring-1">
            <WalletCards className="size-6" />
          </AlertDialogMedia>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <AlertDialogTitle className="text-xl leading-7 font-bold text-pretty">
              포인트가 부족합니다.
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-6 text-pretty">
              <span className="text-foreground font-semibold">{creatorNickname}</span> 채널을
              구독하려면 포인트 충전이 필요합니다. 지금 충전하시겠습니까?
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="m-0 flex-row justify-end gap-2 border-0 bg-transparent px-6 pt-5 pb-6 sm:px-7">
          <AlertDialogCancel className="h-11 min-w-24">취소</AlertDialogCancel>
          <AlertDialogAction type="button" className="h-11 min-w-28" onClick={onConfirm}>
            충전하기
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
