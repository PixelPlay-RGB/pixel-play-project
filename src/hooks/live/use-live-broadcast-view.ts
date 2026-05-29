"use client";
// LiveView · LiveChatPopout에서 공통으로 쓰는 방송 데이터, 메시지, 채팅 세션을 한 곳에서 조합합니다.

import { useLiveViewData } from "@/hooks/live/use-live-view-data";
import { useLiveMessages } from "@/hooks/live/use-live-messages";
import { useLiveChatSession } from "@/hooks/live/use-live-chat-session";
import { useUserWalletBalance } from "@/hooks/donations/use-user-wallet-balance";
import { useAuthStore } from "@/stores/auth";
import { useQueryClient } from "@tanstack/react-query";
import { voteLivePollAction, sendLiveDonationAction } from "@/actions/live/live";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { toastAppError } from "@/utils/common/toast-message";
import { isUuid } from "@/utils/common/uuid";
import {
  getMockLiveBroadcast,
  MOCK_LIVE_CHAT_MESSAGES,
  MOCK_LIVE_DONATIONS,
  MOCK_LIVE_POLLS,
} from "@/mock/live-room";
import { mapLiveWatchToBroadcast } from "@/types/live/live";

// TODO [mock]: UUID 라우팅 연결 시 mock preview 분기 전체 제거
export function useLiveBroadcastView(creatorId: string) {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const { data: watchData, isLoading, refetch } = useLiveViewData(creatorId);

  const isMockPreview = !isUuid(creatorId);
  const mockBroadcast = isMockPreview ? getMockLiveBroadcast(creatorId) : null;
  const broadcast = mockBroadcast ?? mapLiveWatchToBroadcast(watchData);

  const messagesQuery = useLiveMessages(isMockPreview ? null : broadcast?.id);
  const messages = isMockPreview ? MOCK_LIVE_CHAT_MESSAGES : messagesQuery.messages;

  // TODO [mock]: donation/poll RPC 연결 시 MOCK_LIVE_DONATIONS, MOCK_LIVE_POLLS 제거
  const donations = isMockPreview ? MOCK_LIVE_DONATIONS : [];
  const polls = isMockPreview ? MOCK_LIVE_POLLS : [];

  const { walletBalance, isLoading: isWalletLoading, isError: isWalletError } = useUserWalletBalance(user?.id);

  async function votePoll(pollId: string, optionId: string): Promise<boolean> {
    const success = await voteLivePollAction(pollId, optionId);
    if (!success) toastAppError(APP_MESSAGE_CODE.error.live.voteFailed);
    return success;
  }

  async function sendDonation(params: {
    amount: number;
    message: string;
    isAnonymous: boolean;
    idempotencyKey: string;
  }): Promise<boolean> {
    if (!broadcast?.id) return false;
    const success = await sendLiveDonationAction({ broadcastId: broadcast.id, ...params });
    if (success) {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.donations.walletBalance(user?.id ?? undefined),
      });
    } else {
      toastAppError(APP_MESSAGE_CODE.error.live.donationFailed);
    }
    return success;
  }

  const chatSession = useLiveChatSession({
    creatorId,
    broadcastId: broadcast?.id,
    viewerChatState: watchData?.viewerChatState,
    allowMockChat: isMockPreview,
    onChatRuleAccepted: refetch,
  });

  return {
    isLoading,
    refetch,
    broadcast,
    messages,
    donations,
    polls,
    walletBalance,
    isWalletLoading,
    isWalletError,
    votePoll,
    sendDonation,
    isFollowing: watchData?.viewerRelation?.isFollowing ?? false,
    chatRuleText: watchData?.settings.chatRuleText,
    ...chatSession,
  };
}
