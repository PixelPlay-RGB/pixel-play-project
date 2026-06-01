"use client";
// 라이브 채팅 입력 액션과 viewer chat state fallback을 한 곳에서 조립합니다.

import { acceptLiveChatRuleAction, sendLiveMessageAction } from "@/actions/live/live";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { useAuthStore } from "@/stores/auth";
import { toastAppError } from "@/utils/common/toast-message";
import type { LiveViewerChatState } from "@/types/live/live";

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

  const chatState = viewerChatState ?? DEFAULT_CHAT_STATE;

  async function sendMessage(content: string): Promise<boolean> {
    if (!broadcastId) return false;

    try {
      const result = await sendLiveMessageAction(broadcastId, content);
      if (!result.success) {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.message.sendFailed);
      }

      return result.success;
    } catch (error) {
      console.error("라이브 채팅 전송 실패", error);
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

      await onChatRuleAccepted?.();
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
