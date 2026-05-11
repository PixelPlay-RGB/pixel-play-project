"use client";

import { changePasswordAction } from "@/actions/auth";
import AuthInputGroup from "@/components/auth/auth-input-group";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { createClient } from "@/lib/supabase/client";
import { changePasswordSchema, ChangePasswordValues } from "@/lib/zod/auth";
import { getAppMessageTitle } from "@/utils/app-message";
import { toastAppError, toastAppSuccess } from "@/utils/toast-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

interface Props {
  currentPassword: string;
  onOpenChange: () => void;
}

export default function PasswordChangeForm({ currentPassword, onOpenChange }: Props) {
  const supabase = createClient();
  const router = useRouter();

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
        message: getAppMessageTitle(APP_MESSAGE_CODE.error.auth.samePassword),
      });
      return;
    }

    const result = await changePasswordAction(data.newPassword);

    if (!result.success) {
      toastAppError(result.code ?? APP_MESSAGE_CODE.error.auth.passwordChangeFailed);
      return;
    }

    toastAppSuccess(APP_MESSAGE_CODE.success.auth.passwordChanged);

    onOpenChange();

    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
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
      <div className="flex flex-col gap-1">
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
      <Button type="submit" disabled={isSubmitting} className="w-full py-5 font-bold tracking-wide">
        {isSubmitting ? <Spinner /> : "변경하기"}
      </Button>
    </form>
  );
}
