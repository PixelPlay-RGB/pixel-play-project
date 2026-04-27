"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, UserStar } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import ProfileAvatarUpload from "@/components/setting/profile/profile-avatar-upload";
import ProfileCard from "@/components/setting/profile/profile-card";
import ProfileProvidersCard from "@/components/setting/profile/profile-providers-card";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

import { useUser } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";
import { NicknameFormValues, nicknameSchema } from "@/lib/zod/auth";
import type { NicknameStatus } from "@/types/auth";
import { formatDate } from "@/utils/format";

export default function ProfileForm() {
  const { data: user, isLoading } = useUser();

  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>("idle");
  const [verifiedNickname, setVerifiedNickname] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const {
    control,
    getValues,
    setValue,
    reset,
    formState: { errors, isDirty, dirtyFields },
    handleSubmit,
  } = useForm<NicknameFormValues>({
    resolver: zodResolver(nicknameSchema),
    mode: "onChange",
    values: {
      nickname: user?.nickname ?? "",
      photoUrl: user?.photo_url ?? "",
    },
  });

  if (isLoading || !user) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  // 파생 상태 계산
  const nicknameChanged = !!dirtyFields.nickname;
  const canSave = !errors.nickname && (!nicknameChanged || nicknameStatus === "available");

  // 핸들러 정의
  const handleNicknameChange = (value: string) => {
    if (value === user.nickname) {
      setNicknameStatus("idle");
    } else if (value === verifiedNickname) {
      setNicknameStatus("available");
    } else {
      setNicknameStatus("idle");
    }
  };

  const handleCheckNickname = async () => {
    const nickname = getValues("nickname");
    if (!nickname || errors.nickname) return;

    setNicknameStatus("checking");
    // TODO: 실제 API 연동 (checkNicknameAction)
    setVerifiedNickname(nickname);
    setNicknameStatus("available");
  };

  const handleFileChange = (file: File | null) => {
    const url = file ? URL.createObjectURL(file) : null;
    setValue("photoUrl", url, { shouldDirty: true });
  };

  const handleReset = () => {
    reset();
    setNicknameStatus("idle");
  };

  const handleSave = handleSubmit(async (values) => {
    if (!canSave) return;
    setIsSaving(true);
    // TODO: 실제 저장 로직 (updateProfileAction)
    setIsSaving(false);
    toast.success("프로필 업데이트 완료");
  });

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      <ProfileCard
        title={"공개 프로필"}
        contentStyle={"flex flex-col gap-6"}
        footer={
          <>
            <Button variant="outline" onClick={handleReset} disabled={!isDirty || isSaving}>
              되돌리기
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isDirty || isSaving || !canSave}
              className="bg-brand text-white"
            >
              {isSaving ? <Spinner /> : "변경사항 저장"}
            </Button>
          </>
        }
        footerStyle={"justify-end gap-2"}
      >
        <Controller
          name={"photoUrl"}
          control={control}
          render={({ field: { value } }) => (
            <ProfileAvatarUpload
              photoUrl={value || null}
              nickname={getValues("nickname")}
              onFileChange={handleFileChange}
            />
          )}
        />

        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-nickname">닉네임</Label>
          <InputGroup
            className={cn(
              nicknameStatus === "available" &&
                nicknameChanged &&
                "border-brand ring-brand/20 ring-3",
              (nicknameStatus === "taken" || errors.nickname) && "border-destructive",
            )}
          >
            <InputGroupAddon align="inline-start">
              <UserStar className="text-muted-foreground size-4" />
            </InputGroupAddon>
            <Controller
              name="nickname"
              control={control}
              render={({ field }) => (
                <InputGroupInput
                  {...field}
                  id="profile-nickname"
                  onChange={(e) => {
                    field.onChange(e);
                    handleNicknameChange(e.target.value);
                  }}
                />
              )}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                variant="outline"
                onClick={handleCheckNickname}
                disabled={nicknameStatus === "checking" || !!errors.nickname || !nicknameChanged}
                className="text-brand border-brand/40"
              >
                {nicknameStatus === "checking" ? (
                  <Spinner />
                ) : nicknameStatus === "available" && nicknameChanged ? (
                  "사용가능"
                ) : !nicknameChanged ? (
                  "사용 중"
                ) : (
                  "중복확인"
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldError errors={[errors.nickname]} />
        </div>
      </ProfileCard>

      <ProfileCard title="계정 정보">
        <div className="flex flex-col gap-2">
          <Label>이메일</Label>
          <InputGroup className="opacity-75">
            <InputGroupAddon align="inline-start">
              <Mail className="size-4" />
            </InputGroupAddon>
            <InputGroupInput value={user.email} disabled readOnly />
            <InputGroupAddon align="inline-end">
              <Lock className="size-4" />
            </InputGroupAddon>
          </InputGroup>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <dt className="text-muted-foreground text-[12px]">가입일</dt>
            <dd className="font-mono text-sm">{formatDate(user.created_at)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-[12px]">마지막 수정일</dt>
            <dd className="font-mono text-sm">{formatDate(user.modified_at)}</dd>
          </div>
        </dl>
      </ProfileCard>

      <ProfileProvidersCard />
    </form>
  );
}
