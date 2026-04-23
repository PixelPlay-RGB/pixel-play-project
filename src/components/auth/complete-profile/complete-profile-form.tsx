"use client";

import { completeOAuthProfileAction } from "@/actions/auth";
import AuthInputGroup from "@/components/auth/auth-input-group";
import SignUpGenderField from "@/components/auth/signup/signup-gender-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field";
import { RadioGroup } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { PROFILE_QUERY_KEY } from "@/constants/auth";
import { createClient } from "@/lib/supabase/client";
import { completeOAuthProfileSchema, CompleteOAuthProfileValues } from "@/lib/zod/auth";
import { useUserStore } from "@/stores/auth";
import { formatPhone } from "@/utils/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { AtSign, CalendarDays, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface Props {
  defaultNickname: string;
}

export default function CompleteProfileForm({ defaultNickname }: Props) {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, dirtyFields, isSubmitting, isValid },
  } = useForm<CompleteOAuthProfileValues>({
    resolver: zodResolver(completeOAuthProfileSchema),
    mode: "onChange",
    defaultValues: { nickname: defaultNickname, birth: "", phone: "", gender: "male" },
  });

  const onSubmit = async (data: CompleteOAuthProfileValues) => {
    const result = await completeOAuthProfileAction(data);
    if (!result.success) {
      toast.error("오류", { description: result.message });
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

    toast.success("프로필 설정 완료!", {
      description: `🥳 ${data.nickname}님 환영합니다!`,
    });

    router.push("/");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <AuthInputGroup
            {...register("nickname")}
            type="text"
            placeholder="닉네임"
            icon={<AtSign />}
            aria-invalid={!!errors.nickname}
            isValid={!errors.nickname && !!dirtyFields.nickname}
          />
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
        disabled={isSubmitting || !isValid}
        className="bg-brand hover:bg-brand/85 w-full cursor-pointer py-5 font-bold tracking-widest text-white uppercase disabled:opacity-40"
      >
        {isSubmitting ? <Spinner /> : "완료"}
      </Button>
    </form>
  );
}
