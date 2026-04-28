"use client";

import {
  checkNicknameAction,
  completeSignupAction,
  sendOtpAction,
  verifyOtpAction,
} from "@/actions/auth";
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
import { SIGNUP_FORM_DEFAULTS, USER_QUERY_KEY, WELCOME_PARAM } from "@/constants/auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { signUpSchema } from "@/lib/zod/auth";
import { useAuthStore } from "@/stores/auth";
import type { NicknameStatus, OtpStatus, SignUpFormValues } from "@/types/auth";
import { formatPhone } from "@/utils/format";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, LockKeyhole, Mail, Smartphone, User, UserStar } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

export default function SignupForm() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const [otpStatus, setOtpStatus] = useState<OtpStatus>("idle");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>("idle");
  const [verifiedNickname, setVerifiedNickname] = useState("");

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

  const handleCheckNickname = async () => {
    const nickname = getValues("nickname");
    if (!nickname || errors.nickname) return;

    setNicknameStatus("checking");
    const result = await checkNicknameAction(nickname);
    if (result.success) {
      setVerifiedNickname(nickname);
      setNicknameStatus("available");
    } else {
      setNicknameStatus("taken");
    }
  };

  // 1. OTP 발송
  const handleSendOtp = async () => {
    const email = getValues("email");
    if (!email) {
      return;
    }

    setOtpStatus("sending");
    setOtpError("");
    clearErrors("email");

    const result = await sendOtpAction(email);
    if (result.success) {
      setOtpStatus("sent");
      toast.success("인증 코드 발송", { description: "이메일을 확인해주세요!" });
    } else {
      setOtpStatus("idle");
      setError("email", { type: "server", message: result.message });
    }
  };

  // 2. OTP 검증
  const handleVerifyOtp = async () => {
    const email = getValues("email");
    if (!email || !otpCode) {
      return;
    }

    if (otpCode.length < 6) return;

    setOtpStatus("verifying");
    setOtpError("");

    const result = await verifyOtpAction(email, otpCode);
    if (result.success) {
      setOtpStatus("verified");
      toast.success("이메일 인증 완료", { description: "회원 가입을 계속 진행해주세요!" });
    } else {
      setOtpStatus("sent");
      setOtpError("인증 코드가 올바르지 않습니다.");
    }
  };

  // 3. 최종 가입
  const onSubmit = async (data: SignUpFormValues) => {
    if (!emailVerified) {
      toast.error("이메일 인증 필요", {
        description: "먼저 이메일 인증을 완료해주세요! 📧",
      });
      return;
    }

    if (nicknameStatus !== "available") {
      toast.error("닉네임 중복 확인이 필요합니다.", {
        description: "닉네임 중복 확인을 완료해주세요.",
      });
      return;
    }

    const result = await completeSignupAction(data);

    if (!result.success) {
      toast.error("회원가입 실패", { description: result.message });
      return;
    }

    // 서버 액션에서 세팅된 쿠키를 클라이언트가 읽어 store 동기화
    const supabase = createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      toast.error("인증 정보를 가져오지 못했습니다.", {
        description: "로그인 페이지에서 다시 로그인을 시도해주세요.",
      });
      setUser(null);
      return;
    }

    setUser(authUser);
    await queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY.all });

    router.push(`/${WELCOME_PARAM}`);
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="m-auto flex max-w-md flex-col gap-4 sm:gap-5"
    >
      <div className="flex w-full flex-col gap-3">
        {/* 이메일 인증 섹션 */}
        <div className="flex flex-col gap-1">
          <InputGroup
            className={cn(
              "w-full py-5 transition-all",
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

        {/* OTP 입력 섹션 */}
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
                  disabled={isVerifyingOtp}
                  className="border-brand/40 text-brand hover:bg-brand hover:cursor-pointer hover:text-white"
                >
                  {isVerifyingOtp ? <Spinner /> : "확인"}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            {otpError && <p className="text-destructive text-xs">{otpError}</p>}
          </div>
        )}

        {/* 비밀번호 섹션 */}
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

      <Separator className="my-1 sm:my-2" />

      {/* 사용자 정보 섹션 */}
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

        {/* 닉네임 중복 확인 섹션 */}
        <div className="flex flex-col gap-1">
          <InputGroup
            className={cn(
              "w-full py-5 transition-all",
              nicknameStatus === "available" &&
                "border-brand ring-brand/20 dark:ring-brand/30 ring-3",
              (nicknameStatus === "taken" || errors.nickname) && "border-destructive",
            )}
          >
            <InputGroupAddon align="inline-start">
              <UserStar className="text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              {...register("nickname", {
                onChange: (e) => {
                  const val = e.target.value.replace(/^\s+/, "");
                  e.target.value = val;

                  setNicknameStatus(val && val === verifiedNickname ? "available" : "idle");
                },
                onBlur: (e) => {
                  const trim = e.target.value.trim();
                  e.target.value = trim;

                  setNicknameStatus(trim && trim === verifiedNickname ? "available" : "idle");
                },
              })}
              type="text"
              placeholder="닉네임"
              aria-invalid={!!errors.nickname || nicknameStatus === "taken"}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCheckNickname}
                disabled={nicknameStatus === "checking" || !!errors.nickname}
                className="border-brand/40 text-brand hover:bg-brand cursor-pointer hover:text-white"
              >
                {nicknameStatus === "checking" ? (
                  <Spinner />
                ) : nicknameStatus === "available" ? (
                  "사용가능"
                ) : (
                  "중복확인"
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {nicknameStatus === "available" && (
            <p className="text-brand px-1 text-xs">사용 가능한 닉네임입니다.</p>
          )}
          {nicknameStatus === "taken" && (
            <p className="text-destructive px-1 text-xs">이미 사용 중인 닉네임입니다.</p>
          )}
          <FieldError errors={[errors.nickname]} />
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

        {/* 휴대전화 섹션 */}
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

        {/* 성별 선택 섹션 */}
        <div className="flex flex-col gap-1">
          <Card className="w-full shadow-none">
            <CardContent>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} className="grid grid-cols-3">
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

      <Separator className="my-1 sm:my-2" />

      {/* 제출 버튼 */}
      <Button
        type="submit"
        disabled={isSubmitting || !emailVerified}
        className={cn(
          "bg-brand hover:bg-brand/85 w-full cursor-pointer py-5 font-bold tracking-widest text-white uppercase",
          "transition-all active:scale-[0.98] disabled:opacity-40",
        )}
      >
        {isSubmitting ? <Spinner /> : "회원가입"}
      </Button>
    </form>
  );
}
