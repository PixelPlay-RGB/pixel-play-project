"use client";
// 라이브 채팅 입력 액션과 viewer chat state fallback을 한 곳에서 조립합니다.

import { useQueryClient } from "@tanstack/react-query";
import { acceptLiveChatRuleAction, sendLiveMessageAction } from "@/actions/live/live";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { LIVE_CHAT_MESSAGE_MAX_LENGTH, LIVE_LABEL } from "@/constants/live/live";
import { useNullableUser } from "@/hooks/profile/use-profile";
import { useAuthStore } from "@/stores/auth";
import { appendLiveMessage, matchesForbiddenWord } from "@/utils/live/live-chat";
import { toastAppError } from "@/utils/common/toast-message";
import type { LiveChatMessage, LiveSenderRole, LiveViewerChatState } from "@/types/live/live";

interface UseLiveChatSessionParams {
  creatorId: string;
  viewerChatState: LiveViewerChatState | null | undefined;
  viewerIsSubscriber?: boolean;
  viewerSubscriptionTotalMonths?: number | null;
  // 크리에이터 지정 금칙어 — 전송 직전 선검사로 원문 깜빡임을 막는다(서버와 동일 매칭).
  forbiddenWords?: string[];
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
  viewerChatState,
  viewerIsSubscriber = false,
  viewerSubscriptionTotalMonths,
  forbiddenWords = [],
  onChatRuleAccepted,
}: UseLiveChatSessionParams) {
  const user = useAuthStore((state) => state.user);
  const isAuthLoading = useAuthStore((state) => state.loading);
  const isLoggedIn = Boolean(user);
  const queryClient = useQueryClient();
  const { data: profile } = useNullableUser(isLoggedIn);

  const chatState = viewerChatState ?? DEFAULT_CHAT_STATE;

  async function sendMessage(content: string): Promise<boolean> {
    // 채팅은 채널 단위(#111) — 방송 여부와 무관하게 creator 기준으로 전송한다.
    if (!creatorId) return false;
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > LIVE_CHAT_MESSAGE_MAX_LENGTH) {
      toastAppError(APP_MESSAGE_CODE.error.message.invalidInput);
      return false;
    }

    const messagesKey = QUERY_KEYS.live.messages(creatorId);

    // 금칙어 안내(로컬 전용 system 메시지) — 직전이 같은 안내면 중복 추가하지 않는다.
    const appendBannedWordNotice = () => {
      const notice: LiveChatMessage = {
        id: `local-system-${crypto.randomUUID()}`,
        type: "system",
        content: LIVE_LABEL.bannedWordNotice,
      };
      queryClient.setQueryData<LiveChatMessage[]>(messagesKey, (prev) => {
        const list = prev ?? [];
        const last = list.at(-1);
        if (last?.type === "system" && last.content === notice.content) return list;
        return appendLiveMessage(list, notice);
      });
    };

    // 금칙어 선검사(GAP-017) — 서버(send_live_message_v4)와 동일 매칭으로 optimistic 추가 전에
    // 막아 원문이 한 프레임도 노출되지 않게 한다. forbiddenWords 미전달 시엔 아래 서버 moderated가 방어한다.
    if (matchesForbiddenWord(trimmed, forbiddenWords)) {
      appendBannedWordNotice();
      return false;
    }

    const clientId = `optimistic-${crypto.randomUUID()}`;
    const isHost = !!user && user.id === creatorId;
    // 역할 마크 즉시 표시: 방장은 확정이고, 그 외(후원자 등)는 캐시에 있는 내 직전 메시지의
    // 서버 스냅샷을 재사용한다. 첫 메시지는 realtime echo가 서버 버전으로 교체하며 채워진다.
    const lastOwnRole = queryClient
      .getQueryData<LiveChatMessage[]>(messagesKey)
      ?.findLast((message) => message.senderId === user?.id && message.senderRole)?.senderRole;
    // 다중 뱃지 즉시 표시: 내 직전 확정 메시지의 합성 역할들을 재사용한다(첫 메시지는 echo가 채운다).
    const lastOwnRoles = queryClient
      .getQueryData<LiveChatMessage[]>(messagesKey)
      ?.findLast(
        (message) => message.senderId === user?.id && message.senderRoles?.length,
      )?.senderRoles;
    // 후원 직후엔 직전 메시지 스냅샷이 후원 전 역할(viewer)이라 뱃지가 realtime echo 시점에야
    // 붙는다(#120) — 후원 성공 시 승격해둔 역할이 있으면 viewer 스냅샷보다 우선한다.
    // manager 등 상위 역할 스냅샷은 그대로 둔다(승격 신호는 donor 한정).
    const promotedRole = queryClient.getQueryData<LiveSenderRole>(
      QUERY_KEYS.live.viewerRole(creatorId, user?.id ?? undefined),
    );
    const optimisticViewerRole =
      lastOwnRole && lastOwnRole !== "viewer" ? lastOwnRole : (promotedRole ?? lastOwnRole);
    // 호스트도 후원 이력이 있으면 직전 합성이 ['creator','donor']라, 그 스냅샷을 우선해 뱃지 깜빡임을 막는다.
    const optimisticRoles: Exclude<LiveSenderRole, "viewer">[] = isHost
      ? (lastOwnRoles ?? ["creator"])
      : (lastOwnRoles ??
        (optimisticViewerRole && optimisticViewerRole !== "viewer" ? [optimisticViewerRole] : []));
    // 단일 senderRole 스냅샷(구독 기능 호환) — 구독자는 subscriber로 즉시 표시한다.
    const senderRole: LiveSenderRole | undefined = isHost
      ? "creator"
      : optimisticViewerRole && optimisticViewerRole !== "viewer"
        ? optimisticViewerRole
        : viewerIsSubscriber
          ? "subscriber"
          : optimisticViewerRole;
    // 본인이 보낸 메시지는 클린봇으로 가리지 않는다(isCleanbotFlagged 미부여).
    // 자기 메시지는 본인 화면에서 항상 보이는 게 자연스럽다.
    const optimisticMessage: LiveChatMessage = {
      id: clientId,
      type: "text",
      // realtime echo와 동일하게 senderId를 채운다. 누락하면 id 승격(아래) 뒤에도 senderId가 빈
      // 채로 남아, 본인이 후원자/방장일 때 자기 화면에서만 후원자 뱃지가 안 뜬다(타인 화면은 정상).
      senderId: user?.id,
      author: profile?.nickname ?? LIVE_LABEL.selfAuthorFallback,
      content: trimmed,
      isHost,
      senderRole,
      senderRoles: optimisticRoles,
      isSubscriber: !isHost && viewerIsSubscriber,
      subscriptionTotalMonths:
        !isHost && viewerIsSubscriber ? (viewerSubscriptionTotalMonths ?? undefined) : undefined,
    };

    const removeOptimistic = () =>
      queryClient.setQueryData<LiveChatMessage[]>(messagesKey, (prev) =>
        prev?.filter((message) => message.id !== clientId),
      );

    // 낙관적 추가 — realtime echo를 기다리지 않고 즉시 표시한다.
    queryClient.setQueryData<LiveChatMessage[]>(messagesKey, (prev) =>
      appendLiveMessage(prev ?? [], optimisticMessage),
    );

    try {
      const result = await sendLiveMessageAction(creatorId, trimmed);

      if (!result.success || !result.data) {
        removeOptimistic();
        toastAppError(result.code ?? APP_MESSAGE_CODE.error.message.sendFailed);
        return false;
      }

      // 금칙어 감지: 서버는 어떤 행도 broadcast하지 않는다(타인 화면엔 아무것도 안 뜸).
      // 작성자 본인 화면에서만 원문(낙관적)을 제거하고 로컬 시스템 안내로 대체한다.
      // 이 안내는 DB/Realtime를 거치지 않는 로컬 전용 메시지다. Realtime 재구독(SUBSCRIBED) 시
      // invalidate되면 사라지는 best-effort 안내이며, type:"system"은 본인 전용 안내로만 쓴다.
      // false를 반환해 입력창에 원문을 복원한다 — 금칙어만 지우고 바로 재전송할 수 있게.
      if (result.data.moderated) {
        removeOptimistic();
        appendBannedWordNotice();
        return false;
      }

      // 성공: temp id를 실제 messageId로 승격한다. realtime echo가 먼저 도착해
      // 실제 메시지를 넣었으면 중복을 피하려 낙관적 항목만 제거한다.
      const realId = result.data.messageId;
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
