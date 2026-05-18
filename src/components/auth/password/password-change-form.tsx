"use client";
// password-change-form 컴포넌트를 제공합니다.

import { changePasswordAction } from "@/actions/auth/password";
import AuthInputGroup from "@/components/auth/auth-input-group";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { FORM_MESSAGE } from "@/constants/form-message";
import { changePasswordSchema, ChangePasswordValues } from "@/lib/zod/auth";
import { useAuthStore } from "@/stores/auth";
import { toastAppError, toastAppSuccess } from "@/utils/toast-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

interface Props {
  currentPassword: string;
  onOpenChange: () => void;
}

export default function PasswordChangeForm({ currentPassword, onOpenChange }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: ChangePasswordValues) => {
    if (data.newPassword === currentPassword) {
      setError("newPassword", {
        type: "manual",
        message: FORM_MESSAGE.auth.samePassword,
      });
      return;
    }

    const result = await changePasswordAction({
      currentPassword,
      newPassword: data.newPassword,
    });

    if (!result.success) {
      toastAppError(result.code ?? APP_MESSAGE_CODE.error.auth.passwordChangeFailed);
      return;
    }

    toastAppSuccess(APP_MESSAGE_CODE.success.auth.passwordChanged);

    onOpenChange();
    setUser(null);
    queryClient.clear();
    router.replace("/auth/login");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <AuthInputGroup
          {...register("newPassword")}
          type="password"
          placeholder="새 비밀번호"
          icon={<LockKeyhole />}
          aria-invalid={!!errors.newPassword}
          isValid={!errors.newPassword && !!dirtyFields.newPassword}
        />
        <FieldError errors={[errors.newPassword]} />
      </div>
      <div className="flex flex-col gap-1.5">
        <AuthInputGroup
          {...register("newPasswordConfirm")}
          type="password"
          placeholder="새 비밀번호 확인"
          icon={<LockKeyhole />}
          aria-invalid={!!errors.newPasswordConfirm}
          isValid={!errors.newPasswordConfirm && !!dirtyFields.newPasswordConfirm}
        />
        <FieldError errors={[errors.newPasswordConfirm]} />
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="bg-brand shadow-brand/20 hover:bg-brand/90 h-11 w-full rounded-xl font-bold text-white shadow-sm"
      >
        {isSubmitting ? <Spinner /> : "변경하기"}
      </Button>
    </form>
  );
}
