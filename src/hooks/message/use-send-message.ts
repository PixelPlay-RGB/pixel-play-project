"use client";
// 메시지 전송 서버 액션과 후속 캐시 갱신을 담당하는 mutation 훅

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { sendMessageAction } from "@/actions/message";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { QUERY_KEYS } from "@/constants/query-keys";
import { toastAppError } from "@/utils/toast-message";

export function useSendMessage(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => sendMessageAction({ roomId, content }),
    onSuccess: (result) => {
      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.message.sendFailed);
        return;
      }

      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.list() });
    },
    onError: (error) => {
      console.error("메시지 전송 처리 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.message.sendFailed);
    },
  });
}
