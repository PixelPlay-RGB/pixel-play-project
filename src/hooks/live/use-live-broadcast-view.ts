"use client";
// LiveView · LiveChatPopout에서 공통으로 쓰는 방송 데이터, 메시지, 채팅 세션을 한 곳에서 조합합니다.

import { useMemo, useState } from "react";
import { useLiveViewData } from "@/hooks/live/use-live-view-data";
import { useLiveMessages } from "@/hooks/live/use-live-messages";
import { useLivePolls } from "@/hooks/live/use-live-polls";
import { useLiveChatSession } from "@/hooks/live/use-live-chat-session";
import { useUserWalletBalance } from "@/hooks/donations/use-user-wallet-balance";
import { useAuthStore } from "@/stores/auth";
import { useQueryClient } from "@tanstack/react-query";
import { voteLivePollAction, sendLiveDonationAction } from "@/actions/live/live";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { toastAppError } from "@/utils/common/toast-message";
import { LIVE_LABEL } from "@/constants/live/live";
import { mapLiveWatchToBroadcast, type LiveChatMessage, type LiveDonation } from "@/types/live/live";

export function useLiveBroadcastView(creatorId: string) {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const { data: watchData, isLoading, refetch } = useLiveViewData(creatorId);

  const broadcast = mapLiveWatchToBroadcast(watchData);

  const [optimisticFollowing, setOptimisticFollowing] = useState<boolean | null>(null);
  const isFollowing = optimisticFollowing ?? watchData?.viewerRelation?.isFollowing ?? false;

  function onFollowToggled() {
    const next = !isFollowing;
    setOptimisticFollowing(next);
    void refetch()
      .then((result) => {
        if ((result.data?.viewerRelation?.isFollowing ?? false) !== next) {
          console.error("팔로우 상태 refetch 결과가 optimistic 상태와 다름");
        }
      })
      .finally(() => {
        setOptimisticFollowing(null);
      });
  }

  const messagesQuery = useLiveMessages(broadcast?.id);
  const messages = messagesQuery.messages;

  const pollsQuery = useLivePolls(broadcast?.id);

  // donations: 현재 방송 세션 메시지(최대 100건)에서 파생 — 주간 랭킹이 필요하면 별도 RPC 추가 필요
  // polls: live_poll.options에 count 필드가 없으면 0으로 표시됨 — vote_live_poll RPC가 역정규화하지 않는 경우
  const donations = useMemo<LiveDonation[]>(
    () =>
      messages
        .filter((m): m is LiveChatMessage & { donationAmount: number } =>
          m.type === "donation" && typeof m.donationAmount === "number" && m.donationAmount > 0
        )
        .map((m) => ({ id: m.id, author: m.author ?? LIVE_LABEL.anonymousAuthor, amount: m.donationAmount, message: m.content })),
    [messages],
  );

  const { walletBalance, isLoading: isWalletLoading, isError: isWalletError } = useUserWalletBalance(user?.id);

  async function votePoll(pollId: string, optionId: string): Promise<boolean> {
    const broadcastId = broadcast?.id;
    const success = await voteLivePollAction(pollId, optionId);
    if (!success) {
      toastAppError(APP_MESSAGE_CODE.error.live.voteFailed);
      return false;
    }
    if (broadcastId) {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.live.polls(broadcastId),
      });
    }
    return true;
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
    onChatRuleAccepted: refetch,
  });

  return {
    isLoading,
    broadcast,
    messages,
    donations,
    polls: pollsQuery.polls,
    isPollsLoading: pollsQuery.isLoading,
    isPollsError: Boolean(pollsQuery.error),
    walletBalance,
    isWalletLoading,
    isWalletError,
    votePoll,
    sendDonation,
    isFollowing,
    onFollowToggled,
    chatRuleText: watchData?.settings.chatRuleText,
    ...chatSession,
  };
}
