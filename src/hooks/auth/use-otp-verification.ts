"use client";
// 회원가입 이메일 OTP 발송·검증 상태 머신을 관리합니다.

import { useState } from "react";

import { FORM_MESSAGE } from "@/constants/common/form-message";
import { useSendOtpMutation, useVerifyOtpMutation } from "@/hooks/auth/use-signup-mutations";
import type { OtpStatus } from "@/types/auth/auth";

interface UseOtpVerificationOptions {
  // 폼의 현재 이메일 값을 호출 시점에 읽는다(렌더 결합 회피, useNicknameAvailability와 동일 패턴).
  getEmail: () => string;
  hasEmailError: () => boolean;
  isBlocked: () => boolean;
  onEmailFieldError: (message: string) => void;
  onClearEmailError: () => void;
}

export function useOtpVerification({
  getEmail,
  hasEmailError,
  isBlocked,
  onEmailFieldError,
  onClearEmailError,
}: UseOtpVerificationOptions) {
  const [otpStatus, setOtpStatus] = useState<OtpStatus>("idle");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");

  const sendOtpMutation = useSendOtpMutation();
  const verifyOtpMutation = useVerifyOtpMutation();

  const emailVerified = otpStatus === "verified";
  const otpSent = otpStatus !== "idle" && otpStatus !== "sending";

  const handleOtpCodeChange = (value: string) => {
    setOtpCode(value.replace(/\D/g, "").slice(0, 6));
  };

  const handleSendOtp = async () => {
    const email = getEmail();
    if (isBlocked() || emailVerified || !email || hasEmailError()) {
      return;
    }

    setOtpStatus("sending");
    setOtpError("");
    onClearEmailError();

    const result = await sendOtpMutation.mutateAsync(email).catch(() => ({
      success: false,
      fieldMessage: FORM_MESSAGE.auth.emailCheckFailed,
    }));

    if (result.success) {
      setOtpStatus("sent");
      return;
    }

    setOtpStatus("idle");
    onEmailFieldError(result.fieldMessage ?? FORM_MESSAGE.auth.emailCheckFailed);
  };

  const handleVerifyOtp = async () => {
    const email = getEmail();
    if (isBlocked() || !email || !otpCode || otpCode.length < 6) {
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

  return {
    emailVerified,
    handleOtpCodeChange,
    handleSendOtp,
    handleVerifyOtp,
    isOtpMutationPending: sendOtpMutation.isPending || verifyOtpMutation.isPending,
    isSendingOtp: sendOtpMutation.isPending,
    isVerifyingOtp: verifyOtpMutation.isPending,
    otpCode,
    otpError,
    otpSent,
  };
}
