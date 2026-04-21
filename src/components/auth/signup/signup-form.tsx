"use client";

import { completeSignupAction, sendOtpAction, verifyOtpAction } from "@/actions/auth";
import AuthInputGroup from "@/components/auth/auth-input-group";
import SignUpGenderField from "@/components/auth/signup/signup-gender-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { RadioGroup } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { SIGNUP_FORM_DEFAULTS, signUpSchema } from "@/lib/zod/auth";
import type { OtpStatus, SignUpFormValues } from "@/types/auth";
import { formatPhone } from "@/utils/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, LockKeyhole, Mail, Smartphone, User } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

export default function SignupForm() {
  const router = useRouter();
  const [otpStatus, setOtpStatus] = useState<OtpStatus>("idle");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");

  const emailVerified = otpStatus === "verified";
  const isSendingOtp = otpStatus === "sending";
  const isVerifyingOtp = otpStatus === "verifying";
  const otpSent = otpStatus !== "idle" && otpStatus !== "sending";

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setError,
    clearErrors,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
    defaultValues: SIGNUP_FORM_DEFAULTS,
  });

  const handleSendOtp = async () => {
    const email = getValues("email");
    if (!email) return;
    setOtpStatus("sending");
    setOtpError("");
    clearErrors("email");
    const result = await sendOtpAction(email);
    if (result.success) {
      setOtpStatus("sent");
      toast.success("인증 코드 발송", { description: "이메일을 확인해주세요." });
    } else {
      setOtpStatus("idle");
      setError("email", { type: "server", message: result.message });
    }
  };

  const handleVerifyOtp = async () => {
    const email = getValues("email");
    if (!email || !otpCode) return;
    setOtpStatus("verifying");
    setOtpError("");
    const result = await verifyOtpAction(email, otpCode);
    if (result.success) {
      setOtpStatus("verified");
      toast.success("이메일 인증 완료");
    } else {
      setOtpStatus("sent");
      setOtpError("인증 코드가 올바르지 않습니다.");
    }
  };

  const onSubmit = async (data: SignUpFormValues) => {
    if (!emailVerified) return;
    const { email, password, name, birth, phone, gender } = data;
    const result = await completeSignupAction({ password, name, birth, phone, gender });
    if (result.success) {
      const loginResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (loginResult?.ok) {
        toast.success("회원가입 성공!", {
          description: `🥳 ${name}님 환영합니다`,
        });
        router.push("/");
      } else {
        toast.error("자동 로그인 실패", {
          description: "로그인 페이지로 이동합니다.",
        });
        router.push("/auth/login");
      }
    } else if ("message" in result) {
      toast.error("회원가입 실패", { description: result.message });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="m-auto flex max-w-md flex-col gap-5">
      <div className="flex w-full flex-col gap-3">
        <div className="flex flex-col gap-1">
          <InputGroup
            className={cn(
              "w-full py-5",
              (emailVerified || (!errors.email && dirtyFields.email)) &&
                "border-brand ring-brand/20 dark:ring-brand/30 ring-3",
              errors.email && "border-destructive",
            )}
          >
            <InputGroupAddon align="inline-start">
              <Mail className="text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              {...register("email")}
              type="email"
              placeholder="아이디(이메일)"
              aria-invalid={!!errors.email}
              disabled={emailVerified}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                size="sm"
                variant="outline"
                onClick={handleSendOtp}
                disabled={isSendingOtp || emailVerified || !!errors.email}
                className="border-brand/40 text-brand hover:bg-brand cursor-pointer hover:text-white"
              >
                {isSendingOtp ? (
                  <Spinner />
                ) : emailVerified ? (
                  "인증완료"
                ) : otpSent ? (
                  "재발송"
                ) : (
                  "인증"
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldError errors={[errors.email]} />
        </div>

        {otpSent && !emailVerified && (
          <div className="flex flex-col gap-1">
            <InputGroup className={cn("w-full py-5", otpError && "border-destructive")}>
              <InputGroupInput
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="인증 코드 6자리"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={handleVerifyOtp}
                  disabled={isVerifyingOtp || otpCode.length < 6}
                  className="border-brand/40 text-brand hover:bg-brand hover:text-white"
                >
                  {isVerifyingOtp ? <Spinner /> : "확인"}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            {otpError && <p className="text-destructive text-xs">{otpError}</p>}
          </div>
        )}
        <div className="flex flex-col gap-1">
          <AuthInputGroup
            {...register("password")}
            name="password"
            type="password"
            placeholder="비밀번호"
            icon={<LockKeyhole />}
            aria-invalid={!!errors.password}
            isValid={!errors.password && !!dirtyFields.password}
          />
          <FieldError errors={[errors.password]} />
        </div>
        <div className="flex flex-col gap-1">
          <AuthInputGroup
            {...register("passwordConfirm")}
            name="passwordConfirm"
            type="password"
            placeholder="비밀번호 확인"
            icon={<LockKeyhole />}
            aria-invalid={!!errors.passwordConfirm}
            isValid={!errors.passwordConfirm && !!dirtyFields.passwordConfirm}
          />
          <FieldError errors={[errors.passwordConfirm]} />
        </div>
      </div>

      <Separator className="bg-brand/40 my-2" />

      <div className="flex w-full flex-col gap-3">
        <div className="flex flex-col gap-1">
          <AuthInputGroup
            {...register("name")}
            name="name"
            type="text"
            placeholder="이름"
            icon={<User />}
            aria-invalid={!!errors.name}
            isValid={!errors.name && !!dirtyFields.name}
          />
          <FieldError errors={[errors.name]} />
        </div>
        <div className="flex flex-col gap-1">
          <AuthInputGroup
            {...register("birth")}
            name="birth"
            type="date"
            placeholder="생년월일"
            icon={<CalendarDays />}
            aria-invalid={!!errors.birth}
            isValid={!errors.birth && !!dirtyFields.birth}
          />
          <FieldError errors={[errors.birth]} />
        </div>
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <AuthInputGroup
                {...field}
                onChange={(e) => field.onChange(formatPhone(e.target.value))}
                type="text"
                placeholder="휴대전화번호"
                icon={<Smartphone size={18} />}
                aria-invalid={!!errors.phone}
                isValid={!errors.phone && !!dirtyFields.phone}
              />
              <FieldError errors={[errors.phone]} />
            </div>
          )}
        />
        <div className="flex flex-col gap-1">
          <Card className="w-full shadow-none">
            <CardContent>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} className="flex">
                    <SignUpGenderField htmlFor="male" content="남성" radioValue="male" />
                    <SignUpGenderField htmlFor="female" content="여성" radioValue="female" />
                    <SignUpGenderField htmlFor="none" content="선택안함" radioValue="none" />
                  </RadioGroup>
                )}
              />
            </CardContent>
          </Card>
          <FieldError errors={[errors.gender]} />
        </div>
      </div>

      <Separator className="bg-brand/40 my-2" />

      <Button
        type="submit"
        disabled={isSubmitting || !emailVerified}
        className="bg-brand hover:bg-brand/85 w-full cursor-pointer py-5 font-bold tracking-widest text-white uppercase disabled:opacity-40"
      >
        {isSubmitting ? <Spinner /> : "회원가입"}
      </Button>
    </form>
  );
}
