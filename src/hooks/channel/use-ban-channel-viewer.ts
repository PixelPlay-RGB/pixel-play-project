"use client";
// 시청자 강퇴 mutation — 닉네임 팝업의 강퇴 버튼이 호출한다. 성공 시 제재 이력 전체를 무효화해
// 스튜디오 페이지·유저관리 Dialog 가 즉시 갱신되게 한다(강퇴된 당사자 화면은 realtime 이 별도 처리).

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { banChannelViewerAction } from "@/actions/channel/moderation";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";

export function useBanChannelViewer(creatorId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (vars: { targetUserId: string; broadcastId?: string }) =>
      banChannelViewerAction(creatorId, vars.targetUserId, vars.broadcastId),
    onSuccess: async (result) => {
      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.channel.viewerBanFailed);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.channel.viewerBansAll() });
      toastAppSuccess(result.code ?? APP_MESSAGE_CODE.success.channel.viewerBanned);
    },
    onError: (error) => {
      console.error("시청자 강퇴 요청 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.channel.viewerBanFailed);
    },
  });

  // 강퇴 핸들러는 성공 여부(boolean)를 돌려줘 팝업이 닫기/유지를 결정한다.
  const ban = async (targetUserId: string, broadcastId?: string): Promise<boolean> => {
    const result = await mutation.mutateAsync({ targetUserId, broadcastId }).catch(() => null);
    return Boolean(result?.success);
  };

  return { ban, isBanning: mutation.isPending };
}
