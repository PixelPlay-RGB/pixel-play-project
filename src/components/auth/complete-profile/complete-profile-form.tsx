"use client";

import { completeOAuthProfileAction } from "@/actions/auth";
import AuthInputGroup from "@/components/auth/auth-input-group";
import SignUpGenderField from "@/components/auth/signup/signup-gender-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field";
import { RadioGroup } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { completeOAuthProfileSchema, CompleteOAuthProfileValues } from "@/lib/zod/auth";
import { formatPhone } from "@/utils/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { AtSign, CalendarDays, Smartphone } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface Props {
  defaultDisplayName: string;
}

export default function CompleteProfileForm({ defaultDisplayName }: Props) {
  const router = useRouter();
  const { update } = useSession();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, dirtyFields, isSubmitting, isValid },
  } = useForm<CompleteOAuthProfileValues>({
    resolver: zodResolver(completeOAuthProfileSchema),
    mode: "onChange",
    defaultValues: { displayName: defaultDisplayName, birth: "", phone: "", gender: "male" },
  });

  const onSubmit = async (data: CompleteOAuthProfileValues) => {
    const result = await completeOAuthProfileAction(data);
    if (result.success) {
      await update({ profileComplete: true });
      toast.success("프로필 설정 완료!");
      router.push("/");
    } else {
      toast.error("오류", { description: result.message });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <AuthInputGroup
            {...register("displayName")}
            type="text"
            placeholder="닉네임"
            icon={<AtSign />}
            aria-invalid={!!errors.displayName}
            isValid={!errors.displayName && !!dirtyFields.displayName}
          />
          <FieldError errors={[errors.displayName]} />
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
