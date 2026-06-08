"use client";
// 크리에이터 언팔로우 전 확인을 받는 다이얼로그입니다. (보안 재발급 Dialog 컨벤션과 동일한 배너 헤더)

import { UserRoundMinus } from "lucide-react";

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

interface CreatorUnfollowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorNickname: string;
  isPending: boolean;
  onConfirm: () => void;
}

export default function CreatorUnfollowDialog({
  open,
  onOpenChange,
  creatorNickname,
  isPending,
  onConfirm,
}: CreatorUnfollowDialogProps) {
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
            <UserRoundMinus className="size-6" />
          </AlertDialogMedia>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <AlertDialogTitle className="text-xl leading-7 font-bold text-pretty">
              팔로우를 해제할까요?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-6 text-pretty">
              <span className="text-foreground font-semibold">{creatorNickname}</span> 채널의 새
              방송 소식을 더 이상 받아볼 수 없어요. 언제든 다시 팔로우할 수 있어요.
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="m-0 flex-row justify-end gap-2 border-0 bg-transparent px-6 pt-5 pb-6 sm:px-7">
          <AlertDialogCancel disabled={isPending} className="h-11 min-w-24">
            취소
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            className="h-11 min-w-28"
            onClick={onConfirm}
          >
            {isPending ? <Spinner /> : "팔로우 해제"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
