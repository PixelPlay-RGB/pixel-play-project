"use client";
// 메시지 전송 서버 액션과 후속 캐시 갱신을 담당하는 mutation 훅

import {
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";

import { sendMessageAction } from "@/actions/message";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { QUERY_KEYS } from "@/constants/query-keys";
import { insertMessageByCreatedAtDesc } from "@/hooks/message/use-messages";
import { useNullableUser } from "@/hooks/profile/use-profile";
import { useAuthStore } from "@/stores/auth";
import type { AppActionResult } from "@/types/action";
import type { MessageQuery } from "@/types/message";
import { toastAppError } from "@/utils/toast-message";

export type SendMessageVariables =
  | string
  | {
      content: string;
      reuseMessageId?: string;
    };

function toSendVariables(input: SendMessageVariables): {
  content: string;
  reuseMessageId?: string;
} {
  if (typeof input === "string") {
    return { content: input };
  }
  return {
    content: input.content,
    reuseMessageId: input.reuseMessageId,
  };
}

interface MessagesPage {
  items: MessageQuery[];
  nextCursor?: string;
}

function markMessageFailedInCache(
  queryClient: QueryClient,
  roomId: string,
  tempId: string,
): void {
  const queryKey = QUERY_KEYS.chat.messages(roomId);
  queryClient.setQueryData<InfiniteData<MessagesPage>>(queryKey, (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        items: page.items.map((item) =>
          item.id === tempId ? { ...item, clientFailed: true } : item,
        ),
      })),
    };
  });
}

/** 낙관적(임시 id) 메시지를 목록 캐시에서 제거합니다. */
export function removeOptimisticMessage(
  queryClient: QueryClient,
  roomId: string,
  messageId: string,
): void {
  const queryKey = QUERY_KEYS.chat.messages(roomId);
  queryClient.setQueryData<InfiniteData<MessagesPage>>(queryKey, (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        items: page.items.filter((item) => item.id !== messageId),
      })),
    };
  });
}

function applyReconciledMessage(
  previous: InfiniteData<MessagesPage>,
  tempId: string,
  replacement: MessageQuery,
): InfiniteData<MessagesPage> {
  const withoutTempPages = previous.pages.map((page) => ({
    ...page,
    items: page.items.filter((item) => item.id !== tempId),
  }));

  const replacementExists = withoutTempPages.some((page) =>
    page.items.some((item) => item.id === replacement.id),
  );

  if (replacementExists) {
    return {
      ...previous,
      pages: withoutTempPages,
    };
  }

  const [firstPage, ...restPages] = withoutTempPages;
  if (!firstPage) {
    return {
      pageParams: previous.pageParams,
      pages: [{ items: [replacement], nextCursor: undefined }],
    };
  }

  return {
    ...previous,
    pages: [
      {
        ...firstPage,
        items: insertMessageByCreatedAtDesc(firstPage.items, replacement),
      },
      ...restPages,
    ],
  };
}

interface SendMessageContext {
  tempId: string | null;
}

export function useSendMessage(roomId: string) {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((s) => s.user);
  const { data: profile } = useNullableUser();

  return useMutation<
    AppActionResult<{ message: MessageQuery }>,
    Error,
    SendMessageVariables,
    SendMessageContext
  >({
    // 기본 online 모드에서는 오프라인 시 mutation이 pause되어 onError·실패 UI가 뜨지 않음
    networkMode: "always",
    mutationFn: (variables) => {
      const { content } = toSendVariables(variables);
      return sendMessageAction({ roomId, content });
    },
    onMutate: async (variables) => {
      const { content, reuseMessageId } = toSendVariables(variables);
      const queryKey = QUERY_KEYS.chat.messages(roomId);
      await queryClient.cancelQueries({ queryKey });

      if (reuseMessageId) {
        queryClient.setQueryData<InfiniteData<MessagesPage>>(queryKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.id === reuseMessageId
                  ? { ...item, clientFailed: undefined }
                  : item,
              ),
            })),
          };
        });
        return { tempId: reuseMessageId };
      }

      const userId = authUser?.id;
      if (!userId) {
        return { tempId: null };
      }

      const tempId = crypto.randomUUID();
      const now = new Date().toISOString();
      const optimistic: MessageQuery = {
        id: tempId,
        chat_room_id: roomId,
        user_id: userId,
        content,
        created_at: now,
        modified_at: now,
        message_type: "text",
        user: {
          nickname: profile?.nickname ?? "",
          photo_url: profile?.photo_url ?? null,
        },
      };

      queryClient.setQueryData<InfiniteData<MessagesPage>>(queryKey, (old) => {
        if (!old) {
          return {
            pageParams: [undefined],
            pages: [{ items: [optimistic], nextCursor: undefined }],
          };
        }
        const [firstPage, ...restPages] = old.pages;
        if (!firstPage) return old;
        return {
          ...old,
          pages: [
            {
              ...firstPage,
              items: insertMessageByCreatedAtDesc(firstPage.items, optimistic),
            },
            ...restPages,
          ],
        };
      });

      return { tempId };
    },
    onSuccess: (result, _variables, context) => {
      const queryKey = QUERY_KEYS.chat.messages(roomId);

      if (!result.success) {
        if (context?.tempId) {
          markMessageFailedInCache(queryClient, roomId, context.tempId);
        }
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.message.sendFailed);
        return;
      }

      if (context?.tempId && result.data?.message) {
        const replacement = result.data.message;
        const tempId = context.tempId;
        queryClient.setQueryData<InfiniteData<MessagesPage>>(queryKey, (old) => {
          if (!old) return old;
          return applyReconciledMessage(old, tempId, replacement);
        });
      }

      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.list() });
    },
    onError: (error, _variables, context) => {
      if (context?.tempId) {
        markMessageFailedInCache(queryClient, roomId, context.tempId);
      }
      console.error("메시지 전송 처리 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.message.sendFailed);
    },
  });
}
