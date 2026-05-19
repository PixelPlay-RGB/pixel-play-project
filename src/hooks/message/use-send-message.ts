"use client";
// 메시지 전송 서버 액션과 후속 캐시 갱신을 담당하는 mutation 훅

import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";

import { sendMessageAction } from "@/actions/message/message";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import type { AppActionResult } from "@/types/common/action";
import type { MessageListItem, MessageQuery, MessagesPage } from "@/types/message/message";
import type { DBUser } from "@/types/profile/user";
import { createOptimisticMessage, updateFirstMessagesPage } from "@/utils/message/message-cache";
import {
  insertMessageByCreatedAtDesc,
  removeMessageById,
  replaceMessageById,
  updateMessageClientStatus,
} from "@/utils/message/message";
import { toastAppError } from "@/utils/common/toast-message";

export interface SendMessageVariables {
  content: string;
  optimisticMessageId?: string;
}

type SendMessageResult = AppActionResult<{ message: MessageQuery }>;

interface SendMessageContext {
  optimisticMessageId: string;
}

function getOptimisticMessageId(id?: string) {
  return id ?? crypto.randomUUID();
}

export function useSendMessage(roomId: string, currentUser: DBUser | null | undefined) {
  const queryClient = useQueryClient();
  const currentUserId = currentUser?.id ?? "";
  const messagesQueryKey = QUERY_KEYS.chat.messages(roomId);

  const mutation = useMutation<SendMessageResult, Error, SendMessageVariables, SendMessageContext>({
    networkMode: "always",
    mutationFn: ({ content }) => sendMessageAction({ roomId, content }),
    onMutate: async ({ content, optimisticMessageId }) => {
      const nextOptimisticMessageId = getOptimisticMessageId(optimisticMessageId);

      await queryClient.cancelQueries({ queryKey: messagesQueryKey });

      queryClient.setQueryData<InfiniteData<MessagesPage>>(messagesQueryKey, (previous) =>
        updateFirstMessagesPage(previous, (items) => {
          if (optimisticMessageId) {
            return updateMessageClientStatus(items, optimisticMessageId, "sending");
          }

          return insertMessageByCreatedAtDesc(
            items,
            createOptimisticMessage({
              id: nextOptimisticMessageId,
              roomId,
              userId: currentUserId,
              content,
              nickname: currentUser?.nickname ?? "나",
              photoUrl: currentUser?.photo_url ?? null,
            }),
          );
        }),
      );

      return {
        optimisticMessageId: nextOptimisticMessageId,
      };
    },
    onSuccess: (result, _variables, context) => {
      if (!context) return;

      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.message.sendFailed);
        queryClient.setQueryData<InfiniteData<MessagesPage>>(messagesQueryKey, (previous) =>
          updateFirstMessagesPage(previous, (items) =>
            updateMessageClientStatus(items, context.optimisticMessageId, "failed"),
          ),
        );
        return;
      }

      const sentMessage = result.data?.message;

      if (sentMessage) {
        queryClient.setQueryData<InfiniteData<MessagesPage>>(messagesQueryKey, (previous) =>
          updateFirstMessagesPage(previous, (items) =>
            replaceMessageById(items, context.optimisticMessageId, sentMessage),
          ),
        );
      } else {
        queryClient.setQueryData<InfiniteData<MessagesPage>>(messagesQueryKey, (previous) =>
          updateFirstMessagesPage(previous, (items) =>
            updateMessageClientStatus(items, context.optimisticMessageId, "failed"),
          ),
        );
        toastAppError(APP_MESSAGE_CODE.error.message.sendFailed);
        return;
      }

      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.list() });
    },
    onError: (error, _variables, context) => {
      console.error("메시지 전송 처리 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.message.sendFailed);
      queryClient.setQueryData<InfiniteData<MessagesPage>>(messagesQueryKey, (previous) =>
        updateFirstMessagesPage(previous, (items) =>
          updateMessageClientStatus(items, context?.optimisticMessageId ?? "", "failed"),
        ),
      );
    },
  });

  const retryMessage = (message: MessageListItem) => {
    return mutation.mutateAsync({
      content: message.content,
      optimisticMessageId: message.id,
    });
  };

  const cancelMessage = (messageId: string) => {
    queryClient.setQueryData<InfiniteData<MessagesPage>>(messagesQueryKey, (previous) =>
      updateFirstMessagesPage(previous, (items) => removeMessageById(items, messageId)),
    );
  };

  return {
    ...mutation,
    sendMessage: (content: string) => mutation.mutateAsync({ content }),
    retryMessage,
    cancelMessage,
  };
}
