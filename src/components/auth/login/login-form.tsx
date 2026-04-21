"use client";

import AuthInputGroup from "@/components/auth/auth-input-group";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { loginSchema } from "@/lib/zod/auth";
import type { LoginFormValues } from "@/types/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function LoginForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: LoginFormValues) => {
    const result = await signIn("credentials", { ...data, redirect: false });

    if (result?.error) {
      toast.error("로그인에 실패했습니다 🥲", {
        description: "이메일 또는 비밀번호를 확인해주세요.",
      });
      return;
    }

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
        className="w-full cursor-pointer bg-brand py-5 font-bold text-white tracking-widest uppercase hover:bg-brand/85"
      >
        {isSubmitting ? <Spinner /> : "로그인"}
      </Button>
    </form>
  );
}
