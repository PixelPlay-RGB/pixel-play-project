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
import { getAppMessageTitle } from "@/utils/app-message";
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
        const errorData = await response.json();
        throw new Error(errorData.error || getAppMessageTitle("error.auth.accountDeleteFailed"));
      }

      setUser(null);
      queryClient.clear();

      toastAppSuccess("success.auth.signupCanceled");

      router.replace("/auth/login");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;
      toastAppError("error.auth.signupCancelFailed", message);
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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>가입 취소</AlertDialogTitle>
          <AlertDialogDescription>정말로 회원가입을 취소하시겠습니까?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className={"w-20"} disabled={isCancelling}>
            돌아가기
          </AlertDialogCancel>
          <AlertDialogAction
            className={"w-20"}
            variant={"destructive"}
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
