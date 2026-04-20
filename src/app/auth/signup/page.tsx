"use client";

import AuthGenderField from "@/components/auth/auth-gender-field";
import AuthInputGroup from "@/components/auth/auth-input-group";
import AuthMainTitle from "@/components/auth/auth-main-title";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, LockKeyhole, Mail, Smartphone, User } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

export default function Page() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async () => {};

  return (
    <div className={"container m-auto"}>
      <AuthMainTitle title={"회원가입"} />
      <form onSubmit={handleSubmit(onSubmit)} className="m-auto flex max-w-md flex-col gap-5">
        <div className="flex w-full flex-col gap-3">
          <AuthInputGroup
            {...register("email")}
            name={"email"}
            type={"email"}
            placeholder={"아이디(이메일)"}
            icon={<Mail />}
          />
          <AuthInputGroup
            {...register("password")}
            name={"password"}
            type={"password"}
            placeholder={"비밀번호"}
            icon={<LockKeyhole />}
          />
          <AuthInputGroup
            {...register("passwordConfirm")}
            name={"passwordConfirm"}
            type={"password"}
            placeholder={"비밀번호 확인"}
            icon={<LockKeyhole />}
          />
        </div>

        <Separator className="my-2" />

        <div className="flex w-full flex-col gap-3">
          <AuthInputGroup
            {...register("name")}
            name={"name"}
            type={"text"}
            placeholder={"이름"}
            icon={<User />}
          />
          <AuthInputGroup
            {...register("name")}
            name={"birth"}
            type={"date"}
            placeholder={"생년월일 8자리"}
            icon={<CalendarDays />}
          />
          <AuthInputGroup
            {...register("phone")}
            type="text"
            placeholder="휴대전화번호"
            icon={<Smartphone size={18} />}
          />
          <Card className="w-full shadow-none">
            <CardContent>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} className={"flex"}>
                    <AuthGenderField htmlFor="male" content="남성" radioValue="male" />
                    <AuthGenderField htmlFor="female" content="여성" radioValue="female" />
                    <AuthGenderField htmlFor="none" content="선택안함" radioValue="none" />
                  </RadioGroup>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <Separator className="my-2" />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full cursor-pointer py-5 font-bold hover:opacity-80"
        >
          {isSubmitting ? "가입 중..." : "회원가입"}
        </Button>
      </form>
    </div>
  );
}
