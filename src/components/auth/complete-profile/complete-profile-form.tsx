"use client";
// complete-profile-form 컴포넌트를 제공합니다.

import AuthInputGroup from "@/components/auth/auth-input-group";
import CompleteProfileAbandonAlert from "@/components/auth/complete-profile/complete-profile-abandon-alert";
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
import { Spinner } from "@/components/ui/spinner";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { useCompleteProfileMutation } from "@/hooks/auth/use-complete-profile-mutation";
import { useNicknameAvailability } from "@/hooks/profile/use-nickname-availability";
import { cn } from "@/lib/utils";
import { completeOAuthProfileSchema, type CompleteOAuthProfileValues } from "@/lib/zod/auth";
import { getTodayDateInputValue } from "@/utils/common/date";
import { formatPhone } from "@/utils/common/format";
import { toastAppError } from "@/utils/common/toast-message";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Smartphone, User, UserStar } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

interface Props {
  next: string;
}

export default function CompleteProfileForm({ next }: Props) {
  const [isCancelling, setIsCancelling] = useState(false);
  const completeProfileMutation = useCompleteProfileMutation(next);

  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors, dirtyFields, isSubmitting, isValid },
  } = useForm<CompleteOAuthProfileValues>({
    resolver: zodResolver(completeOAuthProfileSchema),
    mode: "onChange",
    defaultValues: { name: "", nickname: "", birth: "", phone: "" },
  });

  const isFormBusy = isSubmitting || isCancelling || completeProfileMutation.isPending;

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

  const handleCheckNickname = async () => {
    await checkNickname();
  };

  const onSubmit = async (data: CompleteOAuthProfileValues) => {
    if (!isNicknameAvailable) {
      toastAppError(APP_MESSAGE_CODE.error.auth.nicknameCheckRequired);
      return;
    }

    await completeProfileMutation.mutateAsync(data).catch(() => undefined);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
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
          <InputGroup
            className={cn(
              "w-full py-5",
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
            <p className="text-brand text-xs">사용 가능한 닉네임입니다.</p>
          )}
          {nicknameStatus === "taken" && (
            <p className="text-destructive text-xs">이미 사용 중인 닉네임입니다.</p>
          )}
          <FieldError errors={[errors.nickname]} />
        </div>

        <div className="flex flex-col gap-1">
          <AuthInputGroup
            {...register("birth")}
            type="date"
            max={getTodayDateInputValue()}
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
                  <RadioGroup
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    className="flex"
                  >
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

      <Button
        type="submit"
        disabled={isBusy || !isValid || !isNicknameAvailable}
        className={cn(
          "w-full cursor-pointer py-5 font-bold tracking-widest uppercase disabled:opacity-40",
          "bg-brand hover:bg-brand/85 text-white",
        )}
      >
        {completeProfileMutation.isPending || isSubmitting ? <Spinner /> : "완료"}
      </Button>
      <CompleteProfileAbandonAlert
        isCancelling={isCancelling}
        isSubmitting={isBusy}
        setIsCancelling={setIsCancelling}
      />
    </form>
  );
}
