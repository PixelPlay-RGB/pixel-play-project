"use client";
// 라이브 시청 화면에서 구독 해지 여부를 확인하는 다이얼로그입니다.

import { StarOff } from "lucide-react";

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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorNickname: string;
  isPending: boolean;
  onConfirm: () => void;
}

export function LiveSubscriptionCancelDialog({
  open,
  onOpenChange,
  creatorNickname,
  isPending,
  onConfirm,
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
        className="overflow-hidden rounded-2xl p-0 shadow-xl data-[size=default]:max-w-sm data-[size=default]:sm:max-w-md"
      >
        <AlertDialogHeader className="border-destructive/10 bg-destructive/5 flex items-center gap-4 border-b px-6 pt-6 pb-5 text-left sm:gap-5 sm:px-7">
          <AlertDialogMedia className="bg-destructive/10 text-destructive ring-destructive/20 mb-0 size-12 shrink-0 rounded-xl ring-1">
            <StarOff className="size-6" />
          </AlertDialogMedia>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <AlertDialogTitle className="text-xl leading-7 font-bold text-pretty">
              구독을 해지할까요?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-6 text-pretty">
              <span className="text-foreground font-semibold">{creatorNickname}</span> 채널의 정기
              구독이 해지 예약됩니다. 이미 결제된 기간이 끝날 때까지 구독 혜택과 배지는 유지됩니다.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="m-0 flex-row justify-end gap-2 border-0 bg-transparent px-6 pt-5 pb-6 sm:px-7">
          <AlertDialogCancel disabled={isPending} className="h-11 min-w-24">
            취소
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={isPending}
            className="h-11 min-w-28"
            onClick={onConfirm}
          >
            {isPending ? <Spinner /> : "구독 해지"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
