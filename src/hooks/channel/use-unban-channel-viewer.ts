"use client";
// 시청자 강퇴 해제 mutation — 제재 이력 목록(스튜디오·Dialog 공용)의 해제 버튼이 호출한다.
// 성공 시 제재 이력 전체를 무효화해 두 표면이 같은 queryKey 로 함께 갱신된다.

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { unbanChannelViewerAction } from "@/actions/channel/moderation";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";

export function useUnbanChannelViewer(creatorId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (targetUserId: string) => unbanChannelViewerAction(creatorId, targetUserId),
    onSuccess: async (result) => {
      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.channel.viewerUnbanFailed);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.channel.viewerBansAll() });
      toastAppSuccess(result.code ?? APP_MESSAGE_CODE.success.channel.viewerUnbanned);
    },
    onError: (error) => {
      console.error("시청자 강퇴 해제 요청 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.channel.viewerUnbanFailed);
    },
  });

  // 해제 핸들러는 성공 여부(boolean)를 돌려줘 다이얼로그가 닫기를 결정한다.
  const unban = async (targetUserId: string): Promise<boolean> => {
    const result = await mutation.mutateAsync(targetUserId).catch(() => null);
    return Boolean(result?.success);
  };

  return { unban, isUnbanning: mutation.isPending };
}
