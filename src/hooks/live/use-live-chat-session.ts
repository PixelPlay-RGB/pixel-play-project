"use client";
// 라이브 채팅 입력 액션과 viewer chat state fallback을 한 곳에서 조립합니다.

import { useQueryClient } from "@tanstack/react-query";
import { acceptLiveChatRuleAction, sendLiveMessageAction } from "@/actions/live/live";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { LIVE_CHAT_MESSAGE_MAX_LENGTH, LIVE_LABEL, LIVE_MESSAGE_LIMIT } from "@/constants/live/live";
import { useNullableUser } from "@/hooks/profile/use-profile";
import { useAuthStore } from "@/stores/auth";
import { toastAppError } from "@/utils/common/toast-message";
import type { LiveChatMessage, LiveViewerChatState } from "@/types/live/live";

interface UseLiveChatSessionParams {
  creatorId: string;
  broadcastId: string | null | undefined;
  viewerChatState: LiveViewerChatState | null | undefined;
  onChatRuleAccepted?: () => Promise<unknown>;
}

const DEFAULT_CHAT_STATE: LiveViewerChatState = {
  canChat: false,
  chatUnavailableReason: "login_required",
  remainingFollowWaitSeconds: 0,
  remainingSlowModeSeconds: 0,
};

export function useLiveChatSession({
  creatorId,
  broadcastId,
  viewerChatState,
  onChatRuleAccepted,
}: UseLiveChatSessionParams) {
  const user = useAuthStore((state) => state.user);
  const isAuthLoading = useAuthStore((state) => state.loading);
  const isLoggedIn = Boolean(user);
  const queryClient = useQueryClient();
  const { data: profile } = useNullableUser(isLoggedIn);

  const chatState = viewerChatState ?? DEFAULT_CHAT_STATE;

  async function sendMessage(content: string): Promise<boolean> {
    if (!broadcastId) return false;
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > LIVE_CHAT_MESSAGE_MAX_LENGTH) {
      toastAppError(APP_MESSAGE_CODE.error.message.invalidInput);
      return false;
    }

    const messagesKey = QUERY_KEYS.live.messages(broadcastId);
    const clientId = `optimistic-${crypto.randomUUID()}`;
    const optimisticMessage: LiveChatMessage = {
      id: clientId,
      type: "text",
      author: profile?.nickname ?? LIVE_LABEL.selfAuthorFallback,
      content: trimmed,
      isHost: !!user && user.id === creatorId,
    };

    const removeOptimistic = () =>
      queryClient.setQueryData<LiveChatMessage[]>(messagesKey, (prev) =>
        prev?.filter((message) => message.id !== clientId),
      );

    // 낙관적 추가 — realtime echo를 기다리지 않고 즉시 표시한다.
    queryClient.setQueryData<LiveChatMessage[]>(messagesKey, (prev) =>
      [...(prev ?? []), optimisticMessage].slice(-LIVE_MESSAGE_LIMIT),
    );

    try {
      const result = await sendLiveMessageAction(broadcastId, trimmed);

      if (!result.success) {
        removeOptimistic();
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.message.sendFailed);
        return false;
      }

      // 성공: temp id를 실제 messageId로 승격한다. realtime echo가 먼저 도착해
      // 실제 메시지를 넣었으면 중복을 피하려 낙관적 항목만 제거한다.
      // TODO [cleanbot]: 금칙어로 moderation_notice가 반환되면 본인 화면엔 원문이 남는다(타인은 숨김 안내 정상 표시).
      const realId = result.data?.messageId;
      if (!realId) {
        // 정상 경로에선 도달하지 않지만, 방어적으로 echo가 채우도록 낙관적만 제거한다.
        removeOptimistic();
        return true;
      }

      queryClient.setQueryData<LiveChatMessage[]>(messagesKey, (prev) => {
        if (!prev) return prev;
        if (prev.some((message) => message.id === realId)) {
          return prev.filter((message) => message.id !== clientId);
        }
        return prev.map((message) =>
          message.id === clientId ? { ...message, id: realId } : message,
        );
      });

      return true;
    } catch (error) {
      console.error("라이브 채팅 전송 실패", error);
      removeOptimistic();
      toastAppError(APP_MESSAGE_CODE.error.message.sendFailed);
      return false;
    }
  }

  async function acceptChatRule(): Promise<boolean> {
    try {
      const result = await acceptLiveChatRuleAction(creatorId);
      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.common.unknown);
        return false;
      }

      if (onChatRuleAccepted) {
        void onChatRuleAccepted().catch((error) => {
          console.error("live chat rule accepted refetch failed", error);
        });
      }
      return true;
    } catch (error) {
      console.error("라이브 채팅 규칙 확인 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.common.unknown);
      return false;
    }
  }

  return {
    isLoggedIn,
    isAuthLoading,
    chatState,
    sendMessage,
    acceptChatRule,
  };
}
