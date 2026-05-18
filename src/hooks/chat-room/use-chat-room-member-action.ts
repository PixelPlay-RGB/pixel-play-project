// 채팅방 참여자 관리 서버 액션과 후속 캐시 갱신을 담당하는 mutation 훅
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { kickChatRoomMemberAction, transferChatRoomOwnerAction } from "@/actions/chat-room-member";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import type { MemberAction } from "@/constants/chat-room-member";
import { invalidateChatRoomMutationQueries } from "@/utils/chat-room-query";
import { toastAppError, toastAppSuccess } from "@/utils/toast-message";

interface Variables {
  targetUserId: string;
}

interface Params {
  action: MemberAction;
  roomId: string;
}

export function useChatRoomMemberAction({ action, roomId }: Params) {
  const queryClient = useQueryClient();
  const isKick = action === "kick";
  const successCode = isKick
    ? APP_MESSAGE_CODE.success.chatRoomMember.kicked
    : APP_MESSAGE_CODE.success.chatRoomMember.ownerTransferred;
  const fallbackErrorCode = isKick
    ? APP_MESSAGE_CODE.error.chatRoomMember.kickFailed
    : APP_MESSAGE_CODE.error.chatRoomMember.transferFailed;

  return useMutation({
    mutationFn: ({ targetUserId }: Variables) =>
      isKick
        ? kickChatRoomMemberAction({ roomId, targetUserId })
        : transferChatRoomOwnerAction({ roomId, targetUserId }),
    onSuccess: (result) => {
      if (!result.success) {
        toastAppError(result.code ?? fallbackErrorCode);
        invalidateChatRoomMutationQueries(queryClient, roomId);
        return;
      }

      toastAppSuccess(result.code ?? successCode);
      invalidateChatRoomMutationQueries(queryClient, roomId);
    },
    onError: (error) => {
      console.error("참여자 관리 작업 처리 실패", error);
      toastAppError(fallbackErrorCode);
      invalidateChatRoomMutationQueries(queryClient, roomId);
    },
  });
}
