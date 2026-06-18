"use client";
// 닉네임 중복확인 입력 필드 — 회원가입/프로필 완성 폼에서 거의 동일하게 쓰던 InputGroup을 공용화한다.
// 중복확인 호출·로딩·결과 표시는 useNicknameAvailability의 상태/핸들러를 prop으로 받아 그대로 위임한다.

import { UserStar } from "lucide-react";
import type { UseFormRegisterReturn } from "react-hook-form";

import { FieldError } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { NicknameStatus } from "@/types/auth/auth";

interface Props {
  // react-hook-form register("nickname", { onChange: syncNicknameStatus })의 반환값을 그대로 받는다.
  registration: UseFormRegisterReturn;
  nicknameStatus: NicknameStatus;
  isCheckingNickname: boolean;
  // react-hook-form errors.nickname. 존재 여부로 게이팅하고 FieldError로 메시지를 표시한다.
  error?: { message?: string };
  isDirty: boolean;
  isBusy: boolean;
  onCheck: () => void;
  // 회원가입 폼은 보조 문구에 px-1을 더한다.
  helperClassName?: string;
}

export function NicknameCheckField({
  registration,
  nicknameStatus,
  isCheckingNickname,
  error,
  isDirty,
  isBusy,
  onCheck,
  helperClassName,
}: Props) {
  const hasError = !!error;

  return (
    <div className="flex flex-col gap-1">
      <InputGroup
        className={cn(
          "w-full py-5 transition-all",
          nicknameStatus === "available" && "border-brand ring-brand/20 dark:ring-brand/30 ring-3",
          (nicknameStatus === "taken" || hasError) && "border-destructive",
        )}
      >
        <InputGroupAddon align="inline-start">
          <UserStar className="text-muted-foreground" />
        </InputGroupAddon>
        <InputGroupInput
          {...registration}
          type="text"
          placeholder="닉네임"
          aria-invalid={hasError || nicknameStatus === "taken"}
          disabled={isBusy}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            size="sm"
            variant="outline"
            onClick={onCheck}
            disabled={isBusy || hasError || !isDirty}
            className="border-brand/40 text-brand hover:bg-brand hover:text-brand-foreground cursor-pointer"
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
        <p className={cn("text-brand text-xs", helperClassName)}>사용 가능한 닉네임입니다.</p>
      )}
      {nicknameStatus === "taken" && (
        <p className={cn("text-destructive text-xs", helperClassName)}>
          이미 사용 중인 닉네임입니다.
        </p>
      )}
      <FieldError errors={[error]} />
    </div>
  );
}
