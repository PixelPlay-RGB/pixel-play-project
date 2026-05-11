"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, UserStar } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

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

import { checkNicknameAction, updateProfileAction } from "@/actions/auth";
import ProfileFormSkeleton from "@/components/setting/profile/profile-form-skeleton";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { QUERY_KEYS } from "@/constants/query-keys";
import { useUser } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";
import { ProfileFormValues, profileSchema } from "@/lib/zod/auth";
import type { NicknameStatus } from "@/types/auth";
import { formatDate } from "@/utils/format";
import { toastAppError, toastAppSuccess } from "@/utils/toast-message";
import { useQueryClient } from "@tanstack/react-query";

export default function ProfileForm() {
  const { data: user, isLoading } = useUser();

  const queryClient = useQueryClient();

  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>("idle");
  const [verifiedNickname, setVerifiedNickname] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const {
    control,
    getValues,
    setValue,
    reset,
    formState: { errors, isDirty, dirtyFields },
    handleSubmit,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
    values: {
      nickname: user?.nickname ?? "",
      photoUrl: user?.photo_url ?? null,
    },
  });

  // blob URL 메모리 누수 방지: photoUrl 이 blob: 으로 바뀔 때마다 이전 blob revoke + unmount cleanup
  const photoUrl = useWatch({ control, name: "photoUrl" });
  useEffect(() => {
    return () => {
      if (photoUrl?.startsWith("blob:")) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  if (isLoading || !user) {
    return <ProfileFormSkeleton />;
  }

  // 파생 상태 계산
  const nicknameChanged = !!dirtyFields.nickname;
  const canSave =
    Object.keys(errors).length === 0 && (!nicknameChanged || nicknameStatus === "available");

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

    const result = await checkNicknameAction(nickname);

    if (!result.success) {
      setNicknameStatus("taken");
      return;
    }

    setVerifiedNickname(nickname);
    setNicknameStatus("available");
  };

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setPendingFile(null);
      setValue("photoUrl", null, { shouldDirty: true });
      return;
    }

    // 1. 일단 서버에 저장하지 않고 로컬 미리보기용 URL만 생성
    const previewUrl = URL.createObjectURL(file);
    setPendingFile(file);
    setValue("photoUrl", previewUrl, { shouldDirty: true });
  };

  const handleReset = () => {
    reset({
      nickname: user.nickname,
      photoUrl: user.photo_url ?? null,
    });
    setNicknameStatus("idle");
    setPendingFile(null);
  };

  const handleSave = async (data: ProfileFormValues) => {
    if (!canSave) return;
    setIsSaving(true);

    const formData = new FormData();
    formData.append("nickname", data.nickname);

    if (pendingFile) {
      // 파일이 새로 선택된 경우에만 FormData에 추가하기
      formData.append("file", pendingFile);
    } else if (dirtyFields.photoUrl && data.photoUrl === null) {
      // 유저가 이미지 파일을 지운경우
      formData.append("shouldDeleteImage", "true");
    } else {
      // 기존 사진 유지인 경우에는 URL 전달
      formData.append("photoUrl", data.photoUrl || "");
    }

    const result = await updateProfileAction(formData);

    if (!result.success) {
      toastAppError(result.code ?? APP_MESSAGE_CODE.error.profile.updateFailed);

      setIsSaving(false);
      return;
    }

    reset({
      ...data,
      photoUrl: result.photoUrl,
    });

    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.all });

    setIsSaving(false);
    setVerifiedNickname(data.nickname);
    setPendingFile(null);

    toastAppSuccess(APP_MESSAGE_CODE.success.profile.updated);
  };

  return (
    <form onSubmit={handleSubmit(handleSave)} className="flex flex-col gap-5">
      <ProfileCard
        title={"공개 프로필"}
        contentStyle={"flex flex-col gap-6"}
        footer={
          <>
            <Button variant="outline" onClick={handleReset} disabled={!isDirty || isSaving}>
              되돌리기
            </Button>
            <Button
              type={"submit"}
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
                    const val = e.target.value.replace(/^\s+/, "");
                    e.target.value = val;

                    field.onChange(val);
                    handleNicknameChange(val);
                  }}
                  onBlur={(e) => {
                    const trim = e.target.value.trim();
                    e.target.value = trim;

                    field.onChange(trim);
                    handleNicknameChange(trim);
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
          {nicknameStatus === "available" && (
            <p className="text-brand text-xs">사용 가능한 닉네임입니다.</p>
          )}
          {nicknameStatus === "taken" && (
            <p className="text-destructive text-xs">이미 사용 중인 닉네임입니다.</p>
          )}
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
