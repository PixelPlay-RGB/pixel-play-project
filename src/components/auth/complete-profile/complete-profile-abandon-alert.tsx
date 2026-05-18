"use client";
// complete-profile-abandon-alert 컴포넌트를 제공합니다.

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
import { LogOut } from "lucide-react";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import type { AppMessageCode } from "@/constants/app-message-code";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { toastAppError, toastAppSuccess } from "@/utils/toast-message";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";

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
        const errorData = (await response.json()) as { code?: AppMessageCode };
        toastAppError(errorData.code ?? APP_MESSAGE_CODE.error.auth.signupCancelFailed);
        setIsCancelling(false);
        return;
      }

      setUser(null);
      queryClient.clear();

      toastAppSuccess(APP_MESSAGE_CODE.success.auth.signupCanceled);

      router.replace("/auth/login");
    } catch (error) {
      console.error("프로필 완성 취소 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.auth.signupCancelFailed);
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
      <AlertDialogContent
        className={cn(
          "overflow-hidden rounded-2xl p-0 shadow-xl sm:max-w-md",
          "border-destructive/20 shadow-destructive/10",
        )}
      >
        <AlertDialogHeader className="bg-destructive/5 border-destructive/10 border-b px-5 pt-5 pb-4 text-left">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1",
                "bg-destructive/10 text-destructive ring-destructive/20",
              )}
            >
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
            className={cn(
              "h-10 min-w-24 rounded-xl px-4 font-semibold",
              "border-border bg-background text-foreground hover:bg-muted",
            )}
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
