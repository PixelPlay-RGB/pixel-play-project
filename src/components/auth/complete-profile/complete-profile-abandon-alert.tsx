"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/stores/auth";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface Props {
  isCancelling: boolean;
  setIsCancelling: Dispatch<SetStateAction<boolean>>;
  isSubmitting: boolean;
}

export default function CompleteProfileAbandonAlert({
  isCancelling,
  setIsCancelling,
  isSubmitting,
}: Props) {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const response = await fetch("/api/auth/withdraw", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "계정 삭제 중 오류가 발생했습니다.");
      }

      setUser(null);
      queryClient.clear();

      toast.success("가입 취소 완료", {
        description: "로그인 페이지로 돌아갑니다.",
      });

      router.replace("/auth/login");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "취소 실패";
      toast.error("취소 실패", {
        description: message,
      });
      setIsCancelling(false);
    }
  };
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting || isCancelling}
            className="w-full cursor-pointer py-5 tracking-widest uppercase"
          >
            {isCancelling ? <Spinner /> : "취소"}
          </Button>
        }
      />
      <AlertDialogContent className="border-destructive/20 shadow-destructive/10 overflow-hidden rounded-2xl p-0 shadow-xl sm:max-w-md">
        <AlertDialogHeader className="bg-destructive/5 border-destructive/10 border-b px-5 pt-5 pb-4 text-left">
          <div className="flex items-center gap-3">
            <span className="bg-destructive/10 text-destructive ring-destructive/20 flex size-10 shrink-0 items-center justify-center rounded-xl ring-1">
              <LogOut className="size-5" />
            </span>
            <div className="min-w-0">
              <AlertDialogTitle className="text-lg font-bold">가입 취소</AlertDialogTitle>
              <AlertDialogDescription className="mt-1 leading-relaxed text-pretty">
                입력 중인 프로필과 생성된 인증 계정을 삭제하고 로그인 페이지로 돌아갑니다.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="m-0 flex-row justify-end gap-2 border-0 bg-transparent px-5 pt-4 pb-5">
          <AlertDialogCancel
            className="border-border bg-background text-foreground hover:bg-muted h-10 min-w-24 rounded-xl px-4 font-semibold"
            disabled={isCancelling}
          >
            돌아가기
          </AlertDialogCancel>
          <AlertDialogAction
            className="shadow-destructive/10 h-10 min-w-24 rounded-xl px-4 font-bold shadow-sm"
            variant="destructive"
            disabled={isCancelling}
            onClick={handleCancel}
          >
            {isCancelling ? <Spinner /> : "가입취소"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
