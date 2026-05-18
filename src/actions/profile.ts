"use server";

// 프로필 수정 Server Action을 관리합니다.
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import type { ActionResponse } from "@/actions/auth/shared";
import { createClient } from "@/lib/supabase/server";
import { isAuthSessionMissingError } from "@/utils/auth-error";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();

  // Form 데이터에서 값 추출
  const nickname = formData.get("nickname") as string;
  const file = formData.get("file") as File | null;
  let photoUrl = (formData.get("photoUrl") as string | null) || null;
  const shouldDeleteImage = formData.get("shouldDeleteImage") === "true";

  // 🚨 [추가된 로직] 파일 크기 검증 (5MB 제한)
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  if (file && file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.profile.imageTooLarge,
    };
  }

  // 유저 세션 확인
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    if (userError && !isAuthSessionMissingError(userError)) {
      console.error("프로필 수정 중 인증 유저 조회 실패", userError);
    }
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.profile.authMissing,
    };
  }

  // 이미지 처리
  if (file || shouldDeleteImage) {
    const { data: existingFiles } = await supabase.storage
      .from("profiles")
      .list(`avatars/${user.id}`);
    const existingPaths = (existingFiles ?? []).map((f) => `avatars/${user.id}/${f.name}`);

    if (file) {
      const fileExt = file.name.split(".").pop();
      const filePath = `avatars/${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        console.error("프로필 이미지 업로드 실패", uploadError);
        return {
          success: false,
          code: APP_MESSAGE_CODE.error.profile.imageUploadFailed,
        };
      }

      // 업로드 성공 후 다른 확장자의 잔재 파일 정리
      const orphans = existingPaths.filter((p) => p !== filePath);
      if (orphans.length > 0) {
        await supabase.storage.from("profiles").remove(orphans);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("profiles").getPublicUrl(filePath);
      photoUrl = `${publicUrl}?t=${Date.now()}`;
    } else {
      if (existingPaths.length > 0) {
        await supabase.storage.from("profiles").remove(existingPaths);
      }
      photoUrl = null;
    }
  }

  // Auth & DB에 데이터 업데이트
  // displayName은 회원가입할때도 굳이 안 건들였음
  const { error: authUpdateError } = await supabase.auth.updateUser({
    data: { avatar_url: photoUrl },
  });

  if (authUpdateError) {
    console.error("프로필 수정 중 인증 정보 업데이트 실패", authUpdateError);
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.profile.userUpdateFailed,
    };
  }

  const { data: updatedProfile, error: updateError } = await supabase
    .from("user")
    .update({
      nickname,
      photo_url: photoUrl,
    })
    .eq("id", user.id)
    .select("id")
    .single();

  if (updateError || !updatedProfile) {
    console.error("프로필 수정 중 사용자 프로필 업데이트 실패", updateError);
    return {
      success: false,
      code:
        updateError?.code === "PGRST116"
          ? APP_MESSAGE_CODE.error.profile.notFound
          : APP_MESSAGE_CODE.error.profile.userUpdateFailed,
    };
  }

  revalidatePath("/", "layout");
  return {
    success: true,
    photoUrl,
  };
}
