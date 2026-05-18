"use client";
// 닉네임 중복 확인 상태 전이를 폼 단위로 관리하는 hook
import { useCheckNicknameMutation } from "@/hooks/auth/use-signup-mutations";
import type { NicknameStatus } from "@/types/auth";
import { useCallback, useState } from "react";

interface UseNicknameAvailabilityOptions {
  getNickname: () => string;
  hasNicknameError: () => boolean;
  isBlocked?: boolean;
  currentNickname?: string | null;
}

export function useNicknameAvailability({
  getNickname,
  hasNicknameError,
  isBlocked = false,
  currentNickname,
}: UseNicknameAvailabilityOptions) {
  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>("idle");
  const [verifiedNickname, setVerifiedNickname] = useState("");
  const { mutateAsync, isPending } = useCheckNicknameMutation();

  const isCurrentNickname = useCallback(
    (nickname: string) => currentNickname != null && nickname === currentNickname,
    [currentNickname],
  );

  const syncNicknameStatus = useCallback(
    (nickname: string) => {
      if (isCurrentNickname(nickname)) {
        setNicknameStatus("idle");
        return;
      }

      setNicknameStatus(nickname && nickname === verifiedNickname ? "available" : "idle");
    },
    [isCurrentNickname, verifiedNickname],
  );

  const resetNicknameAvailability = useCallback(() => {
    setVerifiedNickname("");
    setNicknameStatus("idle");
  }, []);

  const markNicknameAvailable = useCallback((nickname: string) => {
    setVerifiedNickname(nickname);
    setNicknameStatus("available");
  }, []);

  const checkNickname = useCallback(async () => {
    const nickname = getNickname();

    if (isBlocked || !nickname || hasNicknameError()) {
      return false;
    }

    if (isCurrentNickname(nickname)) {
      setNicknameStatus("idle");
      return true;
    }

    setNicknameStatus("checking");

    const result = await mutateAsync(nickname).catch(() => ({
      success: false,
    }));

    if (!result.success) {
      setNicknameStatus("taken");
      return false;
    }

    markNicknameAvailable(nickname);
    return true;
  }, [
    getNickname,
    hasNicknameError,
    isBlocked,
    isCurrentNickname,
    markNicknameAvailable,
    mutateAsync,
  ]);

  return {
    nicknameStatus,
    isCheckingNickname: isPending,
    isNicknameAvailable: nicknameStatus === "available",
    checkNickname,
    syncNicknameStatus,
    resetNicknameAvailability,
    markNicknameAvailable,
  };
}
