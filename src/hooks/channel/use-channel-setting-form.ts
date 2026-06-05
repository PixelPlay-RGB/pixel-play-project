"use client";
// 채널 관리 공개 프로필(사진·닉네임) + 채널 소개(bio)를 한 폼에서 관리합니다.
// 프로필 설정 페이지의 컴포넌트/훅(ProfileAvatarUpload·닉네임 중복확인·프로필 저장)을 그대로 재사용합니다.

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { updateChannelProfileAction } from "@/actions/channel/profile";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { useNicknameAvailability } from "@/hooks/profile/use-nickname-availability";
import { useUser } from "@/hooks/profile/use-profile";
import { useUpdateProfileMutation } from "@/hooks/profile/use-profile-mutations";
import { profileSchema } from "@/lib/zod/auth";
import { channelProfileSettingsSchema } from "@/lib/zod/channel-profile";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";

const channelSettingSchema = profileSchema.extend({
  bio: channelProfileSettingsSchema.shape.bio,
});

export type ChannelSettingFormValues = z.infer<typeof channelSettingSchema>;

export function useChannelSettingForm(initialBio: string) {
  const { data: user, isLoading } = useUser();

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  // 마지막으로 저장된 bio. reset(취소)은 최초값이 아니라 이 값으로 되돌려야 DB와 어긋나지 않는다.
  const [savedBio, setSavedBio] = useState(initialBio);
  const updateProfileMutation = useUpdateProfileMutation();
  const bioMutation = useMutation({
    mutationFn: (bio: string) => updateChannelProfileAction({ bio }),
  });

  const {
    control,
    getValues,
    setValue,
    reset,
    formState: { errors, isDirty, dirtyFields },
    handleSubmit,
  } = useForm<ChannelSettingFormValues>({
    resolver: zodResolver(channelSettingSchema),
    mode: "onChange",
    values: {
      nickname: user?.nickname ?? "",
      photoUrl: user?.photo_url ?? null,
      bio: initialBio,
    },
  });

  const isSaving = updateProfileMutation.isPending || bioMutation.isPending;
  const nicknameAvailability = useNicknameAvailability({
    getNickname: () => getValues("nickname"),
    hasNicknameError: () => !!errors.nickname,
    isBlocked: isSaving,
    currentNickname: user?.nickname,
  });

  const photoUrl = useWatch({ control, name: "photoUrl" });
  const nicknameValue = useWatch({ control, name: "nickname" });

  // blob URL 메모리 누수 방지: photoUrl 이 blob: 으로 바뀔 때마다 cleanup.
  useEffect(() => {
    return () => {
      if (photoUrl?.startsWith("blob:")) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  const nicknameChanged = !!user && nicknameValue !== user.nickname;
  const isBusy = isSaving || nicknameAvailability.isCheckingNickname;
  const canSave =
    Object.keys(errors).length === 0 &&
    (!nicknameChanged || nicknameAvailability.isNicknameAvailable);

  const handleFileChange = (file: File | null) => {
    if (isSaving) return;

    if (!file) {
      setPendingFile(null);
      setValue("photoUrl", null, { shouldDirty: true });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPendingFile(file);
    setValue("photoUrl", previewUrl, { shouldDirty: true });
  };

  const handleReset = () => {
    if (!user || isBusy) return;

    reset({
      nickname: user.nickname,
      photoUrl: user.photo_url ?? null,
      bio: savedBio,
    });
    nicknameAvailability.resetNicknameAvailability();
    setPendingFile(null);
  };

  const submit = handleSubmit(async (data) => {
    if (!canSave || isBusy) return;

    const profileDirty = !!dirtyFields.nickname || !!dirtyFields.photoUrl || !!pendingFile;
    const bioDirty = !!dirtyFields.bio;

    let savedPhotoUrl = data.photoUrl ?? null;

    if (profileDirty) {
      const formData = new FormData();
      formData.append("nickname", data.nickname);

      if (pendingFile) {
        formData.append("file", pendingFile);
      } else if (dirtyFields.photoUrl && data.photoUrl == null) {
        formData.append("shouldDeleteImage", "true");
      } else {
        formData.append("photoUrl", data.photoUrl || "");
      }

      const result = await updateProfileMutation.mutateAsync(formData).catch(() => null);
      if (!result?.success) return;
      savedPhotoUrl = result.photoUrl ?? null;
    }

    let nextSavedBio = data.bio;

    if (bioDirty) {
      const result = await bioMutation.mutateAsync(data.bio).catch(() => null);
      if (!result?.success || !result.data) {
        toastAppError(result?.code ?? APP_MESSAGE_CODE.error.channel.channelProfileSaveFailed);
        return;
      }
      nextSavedBio = result.data.bio ?? "";
      toastAppSuccess(APP_MESSAGE_CODE.success.channel.channelProfileSaved);
    }

    setSavedBio(nextSavedBio);
    reset({ nickname: data.nickname, photoUrl: savedPhotoUrl, bio: nextSavedBio });
    nicknameAvailability.markNicknameAvailable(data.nickname);
    setPendingFile(null);
  });

  return {
    user,
    isLoading,
    control,
    errors,
    isDirty,
    canSave,
    isSaving,
    isBusy,
    nicknameValue,
    nicknameChanged,
    nicknameAvailability,
    handleFileChange,
    handleReset,
    // 프로필(사진·닉네임)+소개 저장 실행(검증 포함). 배너 순서 커밋과 함께 호출된다.
    runSave: submit,
  };
}
