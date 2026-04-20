"use client";

import AuthInputGroup from "@/components/auth/auth-input-group";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { loginSchema, type LoginFormValues } from "@/lib/zod/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: LoginFormValues) => {
    await signIn("credentials", { ...data, callbackUrl: "/" });
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
        />
        <FieldError errors={[errors.password]} />
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full cursor-pointer py-5 font-bold hover:opacity-80"
      >
        {isSubmitting ? <Spinner /> : "로그인"}
      </Button>
    </form>
  );
}
