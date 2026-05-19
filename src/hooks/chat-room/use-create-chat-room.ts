"use client";
// 채팅방 생성 Server Action 호출과 채팅방 목록 캐시 갱신을 관리하는 mutation 훅
import { createChatRoomAction } from "@/actions/chat-room/chat-room";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import type { CreateChatRoomInput } from "@/lib/zod/chat-room";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateChatRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CreateChatRoomInput) => createChatRoomAction(values),
    onSuccess: async (result) => {
      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.chatRoom.createFailed);
        return;
      }

      toastAppSuccess(result.code ?? APP_MESSAGE_CODE.success.chatRoom.created);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.all });
    },
    onError: (error) => {
      console.error("채팅방 생성 요청 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.chatRoom.createFailed);
    },
  });
}
