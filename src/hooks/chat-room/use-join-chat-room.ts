// 채팅방 참여 서버 액션 호출 후 채팅방 관련 쿼리를 무효화하는 mutation 훅
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { joinChatRoomAction } from "@/actions/chat-room/chat-room-member";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { invalidateChatRoomMutationQueries } from "@/utils/chat-room/chat-room-query";
import { toastAppError } from "@/utils/common/toast-message";

export function useJoinChatRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomId: string) => joinChatRoomAction(roomId),
    onSuccess: (result, roomId) => {
      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.chatRoom.joinFailed);
        invalidateChatRoomMutationQueries(queryClient, roomId);
        return;
      }

      invalidateChatRoomMutationQueries(queryClient, roomId);
    },
    onError: (error, roomId) => {
      console.error("채팅방 참여 처리 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.chatRoom.joinFailed);
      invalidateChatRoomMutationQueries(queryClient, roomId);
    },
  });
}
