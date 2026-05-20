"use client";
// signup-form 컴포넌트를 제공합니다.

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
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { SIGNUP_FORM_DEFAULTS } from "@/constants/auth/auth";
import { FORM_MESSAGE } from "@/constants/common/form-message";
import {
  useCompleteSignupMutation,
  useSendOtpMutation,
  useVerifyOtpMutation,
} from "@/hooks/auth/use-signup-mutations";
import { useNicknameAvailability } from "@/hooks/profile/use-nickname-availability";
import { cn } from "@/lib/utils";
import { signUpSchema } from "@/lib/zod/auth";
import type { OtpStatus, SignUpFormValues } from "@/types/auth/auth";
import { getTodayDateInputValue } from "@/utils/common/date";
import { formatPhone } from "@/utils/common/format";
import { toastAppError } from "@/utils/common/toast-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, LockKeyhole, Mail, Smartphone, User, UserStar } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

interface Props {
  next: string;
}

export default function SignupForm({ next }: Props) {
  const [otpStatus, setOtpStatus] = useState<OtpStatus>("idle");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");

  const sendOtpMutation = useSendOtpMutation();
  const verifyOtpMutation = useVerifyOtpMutation();
  const completeSignupMutation = useCompleteSignupMutation(next);

  const emailVerified = otpStatus === "verified";
  const otpSent = otpStatus !== "idle" && otpStatus !== "sending";

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setError,
    clearErrors,
    formState: { errors, dirtyFields, isSubmitting, isValid },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
    defaultValues: SIGNUP_FORM_DEFAULTS,
  });

  const isFormBusy =
    sendOtpMutation.isPending ||
    verifyOtpMutation.isPending ||
    completeSignupMutation.isPending ||
    isSubmitting;

  const {
    nicknameStatus,
    isCheckingNickname,
    isNicknameAvailable,
    checkNickname,
    syncNicknameStatus,
  } = useNicknameAvailability({
    getNickname: () => getValues("nickname"),
    hasNicknameError: () => !!errors.nickname,
    isBlocked: isFormBusy,
  });

  const isBusy = isFormBusy || isCheckingNickname;
  const canSubmit = emailVerified && isNicknameAvailable && isValid && !isBusy;

  const handleCheckNickname = async () => {
    await checkNickname();
  };

  const handleSendOtp = async () => {
    const email = getValues("email");
    if (isBusy || emailVerified || !email || errors.email) {
      return;
    }

    setOtpStatus("sending");
    setOtpError("");
    clearErrors("email");

    const result = await sendOtpMutation.mutateAsync(email).catch(() => ({
      success: false,
      fieldMessage: FORM_MESSAGE.auth.emailCheckFailed,
    }));

    if (result.success) {
      setOtpStatus("sent");
      return;
    }

    setOtpStatus("idle");
    setError("email", {
      type: "server",
      message: result.fieldMessage ?? FORM_MESSAGE.auth.emailCheckFailed,
    });
  };

  const handleVerifyOtp = async () => {
    const email = getValues("email");
    if (isBusy || !email || !otpCode || otpCode.length < 6) {
      return;
    }

    setOtpStatus("verifying");
    setOtpError("");

    const result = await verifyOtpMutation.mutateAsync({ email, token: otpCode }).catch(() => ({
      success: false,
      fieldMessage: FORM_MESSAGE.auth.otpInvalid,
    }));

    if (result.success) {
      setOtpStatus("verified");
      return;
    }

    setOtpStatus("sent");
    setOtpError(result.fieldMessage ?? FORM_MESSAGE.auth.otpInvalid);
  };

  const onSubmit = async (data: SignUpFormValues) => {
    if (!emailVerified) {
      toastAppError(APP_MESSAGE_CODE.error.auth.emailVerificationRequired);
      return;
    }

    if (!isNicknameAvailable) {
      toastAppError(APP_MESSAGE_CODE.error.auth.nicknameCheckRequired);
      return;
    }

    await completeSignupMutation.mutateAsync(data).catch(() => undefined);
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
              disabled={emailVerified || isBusy}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                size="sm"
                variant="outline"
                onClick={handleSendOtp}
                disabled={isBusy || emailVerified || !!errors.email || !dirtyFields.email}
                className="border-brand/40 text-brand hover:bg-brand cursor-pointer hover:text-white"
              >
                {sendOtpMutation.isPending ? (
                  <Spinner />
                ) : emailVerified ? (
                  "인증완료"
                ) : otpSent ? (
                  "재발송"
                ) : (
                  "인증하기"
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
                disabled={isBusy && !verifyOtpMutation.isPending}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={handleVerifyOtp}
                  disabled={isBusy || otpCode.length < 6}
                  className="border-brand/40 text-brand hover:bg-brand hover:cursor-pointer hover:text-white"
                >
                  {verifyOtpMutation.isPending ? <Spinner /> : "확인"}
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
                  syncNicknameStatus(e.target.value);
                },
              })}
              type="text"
              placeholder="닉네임"
              aria-invalid={!!errors.nickname || nicknameStatus === "taken"}
              disabled={isBusy}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCheckNickname}
                disabled={isBusy || !!errors.nickname || !dirtyFields.nickname}
                className="border-brand/40 text-brand hover:bg-brand cursor-pointer hover:text-white"
              >
                {isCheckingNickname ? (
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
            max={getTodayDateInputValue()}
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
        disabled={!canSubmit}
        className={cn(
          "bg-brand hover:bg-brand/85 w-full cursor-pointer py-5 font-bold tracking-widest text-white uppercase",
          "transition-all active:scale-95 disabled:opacity-40",
        )}
      >
        {completeSignupMutation.isPending || isSubmitting ? <Spinner /> : "회원가입"}
      </Button>
    </form>
  );
}
