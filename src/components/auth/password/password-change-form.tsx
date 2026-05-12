"use client";

import { changePasswordAction } from "@/actions/auth";
import AuthInputGroup from "@/components/auth/auth-input-group";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";
import { changePasswordSchema, ChangePasswordValues } from "@/lib/zod/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
        message: "현재 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.",
      });
      return;
    }

    const result = await changePasswordAction(data.newPassword);

    if (!result.success) {
      toast.error(result.message ?? "비밀번호 변경에 실패했습니다.");
      return;
    }

    toast.success("비밀번호 변경 완료", {
      description: "새로운 비밀번호로 다시 로그인해 주세요 😊",
    });

    onOpenChange();

    await supabase.auth.signOut();
    router.refresh();
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
