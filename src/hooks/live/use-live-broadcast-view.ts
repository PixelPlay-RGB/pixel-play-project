"use client";
// LiveView · LiveChatPopout에서 공통으로 쓰는 방송 데이터, 메시지, 채팅 세션을 한 곳에서 조합합니다.

import { useLiveViewData } from "@/hooks/live/use-live-view-data";
import { useLiveMessages } from "@/hooks/live/use-live-messages";
import { useLiveChatSession } from "@/hooks/live/use-live-chat-session";
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
  const { data: watchData, isLoading, refetch } = useLiveViewData(creatorId);

  const mockBroadcast = isUuid(creatorId) ? null : getMockLiveBroadcast(creatorId);
  const isMockPreview = Boolean(mockBroadcast);
  const broadcast = mockBroadcast ?? mapLiveWatchToBroadcast(watchData);

  const messagesQuery = useLiveMessages(isMockPreview ? null : broadcast?.id);
  const messages = isMockPreview ? MOCK_LIVE_CHAT_MESSAGES : messagesQuery.messages;

  // TODO [mock]: donation/poll RPC 연결 시 MOCK_LIVE_DONATIONS, MOCK_LIVE_POLLS 제거
  const donations = isMockPreview ? MOCK_LIVE_DONATIONS : [];
  const polls = isMockPreview ? MOCK_LIVE_POLLS : [];

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
    isFollowing: watchData?.viewerRelation?.isFollowing ?? false,
    chatRuleText: watchData?.settings.chatRuleText,
    ...chatSession,
  };
}
