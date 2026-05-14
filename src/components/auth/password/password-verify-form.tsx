"use client";

import { verifyCurrentPasswordAction } from "@/actions/auth";
import AuthInputGroup from "@/components/auth/auth-input-group";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { FORM_MESSAGE } from "@/constants/form-message";
import { verifyPasswordSchema, VerifyPasswordValues } from "@/lib/zod/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole } from "lucide-react";
import { useForm } from "react-hook-form";

interface Props {
  onVerified: (currentPassword: string) => void;
}

export default function PasswordVerifyForm({ onVerified }: Props) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<VerifyPasswordValues>({
    resolver: zodResolver(verifyPasswordSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: VerifyPasswordValues) => {
    const result = await verifyCurrentPasswordAction(data.currentPassword);

    if (!result.success) {
      setError("currentPassword", {
        message: result.message ?? FORM_MESSAGE.auth.currentPasswordInvalid,
      });
      return;
    }

    onVerified(data.currentPassword);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <AuthInputGroup
          {...register("currentPassword")}
          type="password"
          placeholder="현재 비밀번호"
          icon={<LockKeyhole />}
          aria-invalid={!!errors.currentPassword}
          isValid={!errors.currentPassword && !!dirtyFields.currentPassword}
        />
        <FieldError errors={[errors.currentPassword]} />
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="bg-brand shadow-brand/20 hover:bg-brand/90 h-11 w-full rounded-xl font-bold text-white shadow-sm"
      >
        {isSubmitting ? <Spinner /> : "확인"}
      </Button>
    </form>
  );
}
