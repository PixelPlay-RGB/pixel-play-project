"use client";

import { checkNicknameAction, completeOAuthProfileAction } from "@/actions/auth";
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
import { Spinner } from "@/components/ui/spinner";
import { PROFILE_QUERY_KEY, WELCOME_PARAM } from "@/constants/auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { completeOAuthProfileSchema, CompleteOAuthProfileValues } from "@/lib/zod/auth";
import { useUserStore } from "@/stores/auth";
import type { NicknameStatus } from "@/types/auth";
import { formatPhone } from "@/utils/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Smartphone, User, UserStar } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

export default function CompleteProfileForm() {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const queryClient = useQueryClient();
  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>("idle");
  const [verifiedNickname, setVerifiedNickname] = useState("");

  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors, dirtyFields, isSubmitting, isValid },
  } = useForm<CompleteOAuthProfileValues>({
    resolver: zodResolver(completeOAuthProfileSchema),
    mode: "onChange",
    defaultValues: { name: "", nickname: "", birth: "", phone: "", gender: "male" },
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

  const onSubmit = async (data: CompleteOAuthProfileValues) => {
    if (nicknameStatus !== "available") {
      toast.error("닉네임 중복 확인이 필요합니다.", {
        description: "닉네임 중복 확인을 완료해주세요.",
      });
      return;
    }

    const result = await completeOAuthProfileAction(data);
    if (!result.success) {
      toast.error("프로필 생성 오류", { description: result.message });
      return;
    }

    // 서버 액션에서 갱신된 user_metadata를 클라이언트 store에 동기화
    const supabase = createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      toast.error("인증 오류", {
        description: authError?.message || "유저 세션을 찾을 수 없습니다.",
      });
      return;
    }

    setUser(authUser);
    queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });

    router.push(`/${WELCOME_PARAM}`);
    router.refresh();
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
                  const val = e.target.value;
                  setNicknameStatus(val && val === verifiedNickname ? "available" : "idle");
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
                  <RadioGroup onValueChange={field.onChange} defaultValue="male" className="flex">
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
        disabled={isSubmitting || !isValid || nicknameStatus !== "available"}
        className="bg-brand hover:bg-brand/85 w-full cursor-pointer py-5 font-bold tracking-widest text-white uppercase disabled:opacity-40"
      >
        {isSubmitting ? <Spinner /> : "완료"}
      </Button>
    </form>
  );
}
