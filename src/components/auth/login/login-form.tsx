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
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

// 아이디 저장(이메일만 보관 — 비밀번호는 절대 저장하지 않는다). localStorage 키.
const REMEMBERED_EMAIL_KEY = "pixelplay_remembered_email";

interface LoginFormProps {
  disabled: boolean;
  isPending: boolean;
  onLogin: (values: LoginFormValues) => Promise<unknown>;
}

export default function LoginForm({ disabled, isPending, onLogin }: LoginFormProps) {
  const [rememberEmail, setRememberEmail] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  // 마운트 시 저장해 둔 아이디(이메일)를 채운다 — 비밀번호는 저장하지 않으므로 직접 입력해야 한다.
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (saved) {
      setValue("email", saved, { shouldValidate: true });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRememberEmail(true);
    }
  }, [setValue]);

  const onSubmit = async (data: LoginFormValues) => {
    // 아이디 저장 체크 시 이메일만 보관(다음 방문 prefill), 해제 시 삭제한다.
    if (rememberEmail) {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, data.email);
    } else {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }
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

      <label className="text-muted-foreground flex w-fit cursor-pointer items-center gap-2 text-sm select-none">
        <input
          type="checkbox"
          checked={rememberEmail}
          onChange={(event) => setRememberEmail(event.target.checked)}
          disabled={disabled}
          className="accent-brand size-4 cursor-pointer"
        />
        아이디 저장
      </label>

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
