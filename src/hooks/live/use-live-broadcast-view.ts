"use client";
// LiveView와 LiveChatPopout에서 공통으로 쓰는 방송 데이터와 상호작용 상태를 조합합니다.

import { useState } from "react";
import { useLiveViewData } from "@/hooks/live/use-live-view-data";
import { useLiveMessages } from "@/hooks/live/use-live-messages";
import { useLivePolls } from "@/hooks/live/use-live-polls";
import { useLiveChatSession } from "@/hooks/live/use-live-chat-session";
import { useLiveDonationRanking } from "@/hooks/live/use-live-donation-ranking";
import { useUserWalletBalance } from "@/hooks/donations/use-user-wallet-balance";
import { useAuthStore } from "@/stores/auth";
import { useQueryClient } from "@tanstack/react-query";
import { voteLivePollAction, sendLiveDonationAction } from "@/actions/live/live";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { toastAppError, toastAppInfo } from "@/utils/common/toast-message";
import { LIVE_DONATION_MIN_AMOUNT } from "@/constants/live/live";
import { parseLiveVoteCommand } from "@/utils/live/live-vote-command";
import {
  mapLiveWatchCreator,
  mapLiveWatchToBroadcast,
  type LiveBroadcast,
  type LivePoll,
} from "@/types/live/live";

export function useLiveBroadcastView(creatorId: string) {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const { data: watchData, isLoading, refetch, endedElapsedSeconds } = useLiveViewData(creatorId);

  const broadcast = mapLiveWatchToBroadcast(watchData);
  // 방송이 종료/오프라인(broadcast=null)이어도 크리에이터 정보는 남아 종료 화면에서 쓴다.
  const creator = watchData?.creator ? mapLiveWatchCreator(watchData.creator) : null;

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

  // 시청 중 방송이 종료되면 broadcast가 null이 된다(realtime/refetch). 이때도 마지막 방송 정보
  // (제목·태그·참여자 수)와 채팅 메시지를 그대로 보여주기 위해 마지막 라이브 스냅샷을 유지한다.
  // 라이브 동안 의미 있는 필드(참여자 수·제목)가 바뀔 때만 갱신해(렌더 중 가드된 setState)
  // 무한 루프를 피한다. elapsedSeconds는 매 렌더 변하므로 비교에서 제외하고, 시간은 아래서 따로 고정.
  const [lastBroadcast, setLastBroadcast] = useState<LiveBroadcast | null>(null);
  if (
    broadcast &&
    (broadcast.id !== lastBroadcast?.id ||
      broadcast.viewerCount !== lastBroadcast?.viewerCount ||
      broadcast.title !== lastBroadcast?.title)
  ) {
    setLastBroadcast(broadcast);
  }
  // 한 번이라도 라이브였는지(=시청 중 종료) vs 처음부터 종료된 방송 재진입 구분에 쓴다.
  const hadLiveBroadcast = lastBroadcast !== null;

  const messagesQuery = useLiveMessages(broadcast?.id ?? lastBroadcast?.id, creatorId, user?.id);
  const messages = messagesQuery.messages;

  const pollsQuery = useLivePolls(broadcast?.id, user?.id);
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
    const isUnvote = cachedPolls?.find((poll) => poll.id === pollId)?.userVotedOptionId === optionId;
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
    // 시청 중 종료 시 정보 행(제목·참여자)에 쓰는 마지막 라이브 스냅샷 + 멈춘 경과 시간.
    lastBroadcast,
    endedElapsedSeconds,
    creator,
    hadLiveBroadcast,
    messages,
    donations,
    polls: pollsQuery.polls,
    isPollsLoading: pollsQuery.isLoading,
    isPollsError: Boolean(pollsQuery.error),
    walletBalance,
    isWalletLoading,
    isWalletError,
    donationEnabled,
    donationMinAmount,
    votePoll,
    sendDonation,
    isFollowing,
    onFollowToggled,
    chatRuleText: watchData?.settings.chatRuleText,
    ...chatSession,
    sendMessage,
  };
}
