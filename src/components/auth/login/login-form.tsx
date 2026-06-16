"use client";
// login-form 컴포넌트를 제공합니다.

import AuthInputGroup from "@/components/auth/auth-input-group";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { loginSchema } from "@/lib/zod/auth";
import type { LoginFormValues } from "@/types/auth/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, Mail } from "lucide-react";
import { useForm } from "react-hook-form";

interface LoginFormProps {
  disabled: boolean;
  isPending: boolean;
  onLogin: (values: LoginFormValues) => Promise<unknown>;
}

export default function LoginForm({ disabled, isPending, onLogin }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: LoginFormValues) => {
    await onLogin(data).catch(() => undefined);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <AuthInputGroup
          {...register("email")}
          type="email"
          placeholder="아이디(이메일)"
          icon={<Mail />}
          aria-invalid={!!errors.email}
          isValid={!errors.email && !!dirtyFields.email}
        />
        <FieldError errors={[errors.email]} />
      </div>

      <div className="flex flex-col gap-1">
        <AuthInputGroup
          {...register("password")}
          type={"password"}
          placeholder="비밀번호"
          icon={<LockKeyhole />}
          aria-invalid={!!errors.password}
          isValid={!errors.password && !!dirtyFields.password}
        />
        <FieldError errors={[errors.password]} />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || disabled}
        className={cn(
          "w-full cursor-pointer py-5 font-bold tracking-widest uppercase",
          "bg-brand hover:bg-brand/85 text-brand-foreground",
          "transition-all active:scale-95 disabled:opacity-40",
        )}
      >
        {isSubmitting || isPending ? <Spinner /> : "로그인"}
      </Button>
    </form>
  );
}
