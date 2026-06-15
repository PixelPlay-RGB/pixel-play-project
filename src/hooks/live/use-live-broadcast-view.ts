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
import {
  mapLiveWatchCreator,
  mapLiveWatchToBroadcast,
  type LiveBroadcast,
  type LivePoll,
  type LiveSenderRole,
} from "@/types/live/live";

export function useLiveBroadcastView(creatorId: string) {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const {
    data: watchData,
    isLoading,
    error: watchError,
    refetch,
    endedElapsedSeconds,
  } = useLiveViewData(creatorId);

  const broadcast = mapLiveWatchToBroadcast(watchData);
  // 방송이 종료/오프라인(broadcast=null)이어도 크리에이터 정보는 남아 종료 화면에서 쓴다.
  const creator = watchData?.creator ? mapLiveWatchCreator(watchData.creator) : null;

  const [optimisticFollowing, setOptimisticFollowing] = useState<boolean | null>(null);
  const isFollowing = optimisticFollowing ?? watchData?.viewerRelation?.isFollowing ?? false;

  // 채팅 규칙 게이트 통과 여부(메뉴 동의 칩 표시용) — 두 신호의 합집합.
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
  // 채팅은 채널 단위 타임라인(#111) — 방송 여부와 무관하게 creator 기준으로 조회·전송한다.
  const messagesQuery = useLiveMessages(creatorId);
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
    // 후원도 채널 단위(#111) — 후원이 열려 있으면 방송 외 시간에도 가능하다.
    // 크리에이터는 본인 채널에 후원할 수 없다(서버도 거부하지만 즉시 명확히 안내한다).
    if (user?.id && user.id === creatorId) {
      toastAppError(APP_MESSAGE_CODE.error.live.donationSelf);
      return false;
    }
    if (!donationEnabled) {
      toastAppError(APP_MESSAGE_CODE.error.live.donationDisabled);
      return false;
    }
    try {
      const result = await sendLiveDonationAction({ creatorId, ...params });
      if (result.success) {
        // 후원 성공 즉시 내 역할 스냅샷을 donor로 승격한다(#120) — 서버는 전송 시점에
        // 후원 이력을 직접 조회하므로 이미 정확하고, 낙관적 메시지의 뱃지만 이 신호로 따라온다.
        queryClient.setQueryData<LiveSenderRole>(QUERY_KEYS.live.viewerRole(creatorId), "donor");
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
    // watch 쿼리 오류(재시도 소진) 신호 — 오프라인 확정과 구분해 세션 종료를 보류하는 데 쓴다.
    isWatchError: Boolean(watchError),
    broadcast,
    // 시청 중 종료 시 정보 행(제목·참여자)에 쓰는 마지막 라이브 스냅샷 + 멈춘 경과 시간.
    lastBroadcast,
    endedElapsedSeconds,
    creator,
    messages,
    // 과거 채팅 적재(무한 스크롤) — 초기 50건 이후 위로 스크롤 시 50건씩, 누적 300건에서 중단.
    loadOlderMessages: messagesQuery.loadOlderMessages,
    isLoadingOlderMessages: messagesQuery.isLoadingOlder,
    hasMoreChatHistory: messagesQuery.hasMoreHistory,
    entryNoticeAnchorId: messagesQuery.entryNoticeAnchorId,
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
    // 팔로워 전용 대기 시간 안내용 설정값(초).
    followerWaitSeconds: watchData?.settings.followerWaitSeconds ?? 0,
    // 슬로우 모드 간격(초) — 서버 검증과 동일하게 크리에이터 본인에겐 걸지 않는다(0).
    slowModeSeconds:
      watchData?.settings.slowModeEnabled && user?.id !== creatorId
        ? watchData.settings.slowModeSeconds
        : 0,
    // 팔로우 대기 카운트다운 종료 등 게이트 해제 시점에 viewer chat state를 다시 받는다.
    refreshChatState: () => {
      void refetch();
    },
    ...chatSession,
    sendMessage,
  };
}
