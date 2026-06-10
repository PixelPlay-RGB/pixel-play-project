"use client";
// LiveView와 LiveChatPopout에서 공통으로 쓰는 방송 데이터와 상호작용 상태를 조합합니다.

import { useState } from "react";
import { useLiveViewData } from "@/hooks/live/use-live-view-data";
import { useLiveInteractionNotices } from "@/hooks/live/use-live-interaction-notices";
import { useLiveMessages } from "@/hooks/live/use-live-messages";
import { useLivePolls } from "@/hooks/live/use-live-polls";
import { useLiveChatSession } from "@/hooks/live/use-live-chat-session";
import { useLiveDonationRanking } from "@/hooks/live/use-live-donation-ranking";
import { useUserWalletBalance } from "@/hooks/donations/use-user-wallet-balance";
import { useAuthStore } from "@/stores/auth";
import { useQueryClient } from "@tanstack/react-query";
import {
  joinLiveDrawAction,
  voteLivePollAction,
  sendLiveDonationAction,
} from "@/actions/live/live";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { toastAppError, toastAppInfo } from "@/utils/common/toast-message";
import { LIVE_DONATION_MIN_AMOUNT } from "@/constants/live/live";
import { parseLiveVoteCommand } from "@/utils/live/live-vote-command";
import { mapLiveWatchToBroadcast, type LivePoll } from "@/types/live/live";

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
          return;
        }
        setOptimisticFollowing(null);
      })
      .catch((error) => {
        console.error("follow state refetch failed", error);
      });
  }

  const messagesQuery = useLiveMessages(broadcast?.id, creatorId, user?.id);
  const messages = messagesQuery.messages;

  const pollsQuery = useLivePolls(broadcast?.id, user?.id);
  const interactionNoticesQuery = useLiveInteractionNotices(broadcast?.id, user?.id);
  const donationRankingQuery = useLiveDonationRanking(creatorId);
  const donationEnabled = watchData?.settings.donationEnabled ?? false;
  const donationMinAmount = watchData?.settings.donationMinAmount ?? LIVE_DONATION_MIN_AMOUNT;

  const donations = donationRankingQuery.donations;

  const {
    walletBalance,
    isLoading: isWalletLoading,
    isError: isWalletError,
  } = useUserWalletBalance(user?.id);

  async function votePoll(pollId: string, optionId: string): Promise<boolean> {
    const broadcastId = broadcast?.id;
    // 이미 투표한 항목을 그대로 보내면 표 취소(unvote)다 — RPC가 기존 표 행을 삭제하므로
    // 낙관적 갱신도 선택 해제(null)로 둔다.
    const cachedPolls = broadcastId
      ? queryClient.getQueryData<LivePoll[]>(QUERY_KEYS.live.pollsForViewer(broadcastId, user?.id))
      : undefined;
    const isUnvote =
      cachedPolls?.find((poll) => poll.id === pollId)?.userVotedOptionId === optionId;
    try {
      const success = await voteLivePollAction(pollId, optionId);
      if (!success) {
        toastAppError(APP_MESSAGE_CODE.error.live.voteFailed);
        return false;
      }
      if (broadcastId) {
        queryClient.setQueryData<LivePoll[]>(
          QUERY_KEYS.live.pollsForViewer(broadcastId, user?.id),
          (prev) =>
            prev?.map((poll) =>
              poll.id === pollId
                ? { ...poll, userVotedOptionId: isUnvote ? null : optionId }
                : poll,
            ),
        );
        void queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.live.polls(broadcastId),
        });
      }
      return true;
    } catch (error) {
      console.error("라이브 투표 처리 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.live.voteFailed);
      return false;
    }
  }

  async function joinDraw(drawNoticeId: string): Promise<boolean> {
    if (!broadcast?.id) return false;

    try {
      const success = await joinLiveDrawAction({
        broadcastId: broadcast.id,
        drawNoticeId,
      });

      if (!success) {
        toastAppError(APP_MESSAGE_CODE.error.common.unknown);
        return false;
      }

      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.live.interactionNotices(broadcast.id, user?.id),
      });

      return true;
    } catch (error) {
      console.error("라이브 추첨 참여 처리 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.common.unknown);
      return false;
    }
  }

  async function sendDonation(params: {
    amount: number;
    message: string;
    isAnonymous: boolean;
    idempotencyKey: string;
  }): Promise<boolean> {
    if (!broadcast?.id) return false;
    // 크리에이터는 본인 방송에 후원할 수 없다(서버도 거부하지만 즉시 명확히 안내한다).
    if (user?.id && user.id === creatorId) {
      toastAppError(APP_MESSAGE_CODE.error.live.donationSelf);
      return false;
    }
    if (!donationEnabled) {
      toastAppError(APP_MESSAGE_CODE.error.live.donationDisabled);
      return false;
    }
    try {
      const result = await sendLiveDonationAction({ broadcastId: broadcast.id, ...params });
      if (result.success) {
        void queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.donations.walletBalance(user?.id ?? undefined),
        });
        void queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.donations.liveRanking(creatorId),
        });
      } else {
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.live.donationFailed);
      }
      return result.success;
    } catch (error) {
      console.error("라이브 후원 처리 실패", error);
      toastAppError(APP_MESSAGE_CODE.error.live.donationFailed);
      return false;
    }
  }

  const chatSession = useLiveChatSession({
    creatorId,
    broadcastId: broadcast?.id,
    viewerChatState: watchData?.viewerChatState,
    onChatRuleAccepted: refetch,
  });

  async function sendMessage(content: string): Promise<boolean> {
    const voteOptionNumber = parseLiveVoteCommand(content);

    if (voteOptionNumber !== null) {
      if (pollsQuery.error) {
        toastAppError(APP_MESSAGE_CODE.error.live.voteFailed);
        return false;
      }

      const activePoll = pollsQuery.polls.find((p) => p.status === "active") ?? null;
      if (!activePoll) {
        toastAppError(APP_MESSAGE_CODE.error.live.voteNoActivePoll);
        return false;
      }
      const option = activePoll.options[voteOptionNumber - 1];
      if (!option) {
        toastAppError(APP_MESSAGE_CODE.error.live.voteInvalidOption);
        return false;
      }
      // 팝오버는 같은 항목 재클릭 = 표 취소(unvote)지만, 채팅 !N(예: !1)은
      // 같은 번호 재전송이 실수로 표를 취소하는 사고를 막으려 일부러 no-op로 둔다.
      if (option.id === activePoll.userVotedOptionId) {
        toastAppInfo(APP_MESSAGE_CODE.success.live.voteUnchanged);
        return false;
      }
      return votePoll(activePoll.id, option.id);
    }

    return chatSession.sendMessage(content);
  }

  return {
    isLoading,
    broadcast,
    messages,
    donations,
    polls: pollsQuery.polls,
    isPollsLoading: pollsQuery.isLoading,
    isPollsError: Boolean(pollsQuery.error),
    interactionNotices: interactionNoticesQuery.notices,
    isInteractionNoticesLoading: interactionNoticesQuery.isLoading,
    isInteractionNoticesError: Boolean(interactionNoticesQuery.error),
    walletBalance,
    isWalletLoading,
    isWalletError,
    donationEnabled,
    donationMinAmount,
    votePoll,
    joinDraw,
    sendDonation,
    isFollowing,
    onFollowToggled,
    chatRuleText: watchData?.settings.chatRuleText,
    ...chatSession,
    sendMessage,
  };
}
