"use client";

import { login } from "@/actions/auth";
import AuthInputGroup from "@/components/auth/auth-input-group";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { LOGIN_PARAM } from "@/constants/auth";
import { QUERY_KEYS } from "@/constants/query-keys";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { loginSchema } from "@/lib/zod/auth";
import { useAuthStore } from "@/stores/auth";
import type { LoginFormValues, LoginProvider } from "@/types/auth";
import { toastAppError } from "@/utils/toast-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

interface LoginFormProps {
  loading: LoginProvider | null;
  onLoadingChange: (provider: LoginProvider | null) => void;
}

export default function LoginForm({ loading, onLoadingChange: setIsLoading }: LoginFormProps) {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading("email");
    const result = await login(data);

    if (!result.success) {
      toastAppError(result.code ?? APP_MESSAGE_CODE.error.auth.invalidCredentials);
      setIsLoading(null);
      return;
    }

    // 서버 액션에서 세팅된 쿠키를 클라이언트가 읽어 store 동기화
    const supabase = createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      if (authError) {
        console.error("LoginForm getUser error", authError);
      }
      toastAppError(APP_MESSAGE_CODE.error.auth.authInfoLoadFailed);
      setIsLoading(null);
      return;
    }

    setUser(authUser);
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.profile(authUser.id) });

    setIsLoading(null);
    router.push(`/${LOGIN_PARAM}`);
    router.refresh();
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
        disabled={isSubmitting || loading != null}
        className={cn(
          "w-full cursor-pointer py-5 font-bold tracking-widest uppercase",
          "bg-brand hover:bg-brand/85 text-white",
          "transition-all active:scale-[0.98] disabled:opacity-40",
        )}
      >
        {isSubmitting ? <Spinner /> : "로그인"}
      </Button>
    </form>
  );
}
