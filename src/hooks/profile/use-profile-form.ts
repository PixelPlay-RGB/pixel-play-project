"use client";
// 프로필 설정 폼의 조회·검증·사진 미리보기·저장 흐름을 관리합니다.

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { useStickyActionBar } from "@/hooks/common/use-sticky-action-bar";
import { useNicknameAvailability } from "@/hooks/profile/use-nickname-availability";
import { useUpdateProfileMutation } from "@/hooks/profile/use-profile-mutations";
import { useUser } from "@/hooks/profile/use-profile";
import { ProfileFormValues, profileSchema } from "@/lib/zod/auth";

export function useProfileForm() {
  const { data: user, error: userError, isError: isUserError, isLoading } = useUser();

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const updateProfileMutation = useUpdateProfileMutation();

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

  const isSaving = updateProfileMutation.isPending;
  const nicknameAvailability = useNicknameAvailability({
    getNickname: () => getValues("nickname"),
    hasNicknameError: () => !!errors.nickname,
    isBlocked: isSaving,
    currentNickname: user?.nickname,
  });

  // blob URL 메모리 누수 방지: photoUrl 이 blob: 으로 바뀔 때마다 이전 blob revoke + unmount cleanup
  const photoUrl = useWatch({ control, name: "photoUrl" });
  const nicknameValue = useWatch({ control, name: "nickname" });
  useEffect(() => {
    return () => {
      if (photoUrl?.startsWith("blob:")) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  // 파생 상태 계산 (user 없을 때도 안전하도록 guard)
  const nicknameChanged = !!user && nicknameValue !== user.nickname;
  const isBusy = isSaving || nicknameAvailability.isCheckingNickname;
  const canSave =
    Object.keys(errors).length === 0 &&
    (!nicknameChanged || nicknameAvailability.isNicknameAvailable);

  const { sentinelRef, show } = useStickyActionBar(!!user && isDirty);

  const handleCheckNickname = async () => {
    await nicknameAvailability.checkNickname();
  };

  const handleFileChange = (file: File | null) => {
    if (isSaving) return;

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
    if (!user || isBusy) return;

    reset({
      nickname: user.nickname,
      photoUrl: user.photo_url ?? null,
    });
    nicknameAvailability.resetNicknameAvailability();
    setPendingFile(null);
  };

  const handleSave = async (data: ProfileFormValues) => {
    if (!canSave || isBusy) return;

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

    const result = await updateProfileMutation.mutateAsync(formData).catch(() => null);

    if (!result?.success) {
      return;
    }

    reset({
      ...data,
      photoUrl: result.photoUrl,
    });

    nicknameAvailability.markNicknameAvailable(data.nickname);
    setPendingFile(null);
  };

  const submitForm = handleSubmit(handleSave);
  const canSubmit = isDirty && canSave && !isBusy;

  return {
    canSubmit,
    control,
    errors,
    handleCheckNickname,
    handleFileChange,
    handleReset,
    isBusy,
    isLoading,
    isSaving,
    isUserError,
    nicknameAvailability,
    nicknameChanged,
    nicknameValue,
    sentinelRef,
    show,
    submitForm,
    user,
    userError,
  };
}
