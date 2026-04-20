"use client";

import { signUpAction } from "@/actions/auth";
import SignUpGenderField from "@/components/auth/signup/signup-gender-field";
import AuthInputGroup from "@/components/auth/auth-input-group";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field";
import { RadioGroup } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { signUpSchema, type SignUpFormValues } from "@/lib/zod/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, LockKeyhole, Mail, Smartphone, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

export default function SignupForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      passwordConfirm: "",
      name: "",
      birth: "",
      phone: "",
      gender: "male",
    },
  });

  const onSubmit = async (data: SignUpFormValues) => {
    const result = await signUpAction(data);
    if (result.success) {
      router.push("/auth/login");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="m-auto flex max-w-md flex-col gap-5">
      <div className="flex w-full flex-col gap-3">
        <div className="flex flex-col gap-1">
          <AuthInputGroup
            {...register("email")}
            name="email"
            type="email"
            placeholder="아이디(이메일)"
            icon={<Mail />}
            aria-invalid={!!errors.email}
          />
          <FieldError errors={[errors.email]} />
        </div>
        <div className="flex flex-col gap-1">
          <AuthInputGroup
            {...register("password")}
            name="password"
            type="password"
            placeholder="비밀번호"
            icon={<LockKeyhole />}
            aria-invalid={!!errors.password}
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
          />
          <FieldError errors={[errors.passwordConfirm]} />
        </div>
      </div>

      <Separator className="my-2" />

      <div className="flex w-full flex-col gap-3">
        <div className="flex flex-col gap-1">
          <AuthInputGroup
            {...register("name")}
            name="name"
            type="text"
            placeholder="이름"
            icon={<User />}
            aria-invalid={!!errors.name}
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

      <Separator className="my-2" />

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full cursor-pointer py-5 font-bold hover:opacity-80"
      >
        {isSubmitting ? <Spinner /> : "회원가입"}
      </Button>
    </form>
  );
}
