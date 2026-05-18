"use client";
// 프로필 수정 Server Action 호출과 프로필 캐시 갱신을 관리하는 mutation 훅
import { updateProfileAction } from "@/actions/profile";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { QUERY_KEYS } from "@/constants/query-keys";
import { toastAppError, toastAppSuccess } from "@/utils/toast-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (formData: FormData) => updateProfileAction(formData),
    onSuccess: async (result) => {
      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.profile.updateFailed);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.all });
      router.refresh();
      toastAppSuccess(APP_MESSAGE_CODE.success.profile.updated);
    },
    onError: (error) => {
      console.error("프로필 수정 요청 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.profile.updateFailed);
    },
  });
}
