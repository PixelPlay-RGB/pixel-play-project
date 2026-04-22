"use client";

import { login } from "@/actions/auth";
import AuthInputGroup from "@/components/auth/auth-input-group";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/zod/auth";
import { useAuthStore } from "@/stores/auth";
import type { LoginFormValues } from "@/types/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function LoginForm() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: LoginFormValues) => {
    const result = await login(data);

    if (!result.success) {
      toast.error("로그인 실패 🥲", {
        description: result.message,
      });

      return;
    }

    // 서버 액션에서 세팅된 쿠키를 클라이언트가 읽어 store 동기화 (LoginButton 등 즉시 갱신)
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);

    toast.success("로그인 성공", {
      description: `🥳 ${result.data?.displayName}님 환영합니다!`,
    });

    router.push("/");
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
          type="password"
          placeholder="비밀번호"
          icon={<LockKeyhole />}
          aria-invalid={!!errors.password}
          isValid={!errors.password && !!dirtyFields.password}
        />
        <FieldError errors={[errors.password]} />
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="bg-brand hover:bg-brand/85 w-full cursor-pointer py-5 font-bold tracking-widest text-white uppercase"
      >
        {isSubmitting ? <Spinner /> : "로그인"}
      </Button>
    </form>
  );
}
