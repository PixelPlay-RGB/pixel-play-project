"use client";
// 채팅방 나가기 서버 액션 호출 후 채팅 관련 쿼리를 무효화하고 홈으로 이동하는 mutation 훅

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { leaveChatRoomAction } from "@/actions/chat-room/chat-room-member";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import {
  invalidateChatRoomMutationQueries,
  removeChatRoomDetailQueries,
} from "@/utils/chat-room/chat-room-query";
import { toastAppError, toastAppSuccess } from "@/utils/common/toast-message";

export function useLeaveChatRoom() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (roomId: string) => leaveChatRoomAction(roomId),
    onSuccess: (result, roomId) => {
      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.chatRoom.leaveFailed);
        invalidateChatRoomMutationQueries(queryClient, roomId);
        return;
      }

      toastAppSuccess(result.code ?? APP_MESSAGE_CODE.success.chatRoom.left);
      router.push("/");
      removeChatRoomDetailQueries(queryClient);
      invalidateChatRoomMutationQueries(queryClient, roomId);
    },
    onError: (error, roomId) => {
      console.error("채팅방 나가기 처리 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.chatRoom.leaveFailed);
      invalidateChatRoomMutationQueries(queryClient, roomId);
    },
  });
}
