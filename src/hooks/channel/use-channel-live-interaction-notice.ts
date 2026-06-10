"use client";
// 방송 상호작용(추첨·룰렛) 결과 공지를 채팅에 발행하는 공용 훅입니다.

import { useCallback } from "react";

import { sendChannelLiveInteractionNoticeAction } from "@/actions/channel/live";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type { InteractionNoticeType } from "@/types/channel/live-interaction";
import { toastAppError } from "@/utils/common/toast-message";

export function useChannelLiveInteractionNotice(broadcastId: string | null) {
  const publishInteractionNotice = useCallback(
    async ({
      content,
      interactionType,
      metadata,
    }: {
      content: string;
      interactionType: InteractionNoticeType;
      metadata: Record<string, unknown>;
    }) => {
      if (!broadcastId) return null;

      try {
        const result = await sendChannelLiveInteractionNoticeAction({
          broadcastId,
          content,
          interactionType,
          metadata,
        });

        if (!result.success || !result.data) {
          toastAppError(result.code ?? APP_MESSAGE_CODE.error.common.unknown);
          return null;
        }

        return result.data.messageId;
      } catch (error) {
        console.error("라이브 상호작용 결과 공지 액션 실패", error);
        toastAppError(APP_MESSAGE_CODE.error.common.unknown);
        return null;
      }
    },
    [broadcastId],
  );

  return { publishInteractionNotice };
}

export type PublishInteractionNotice = ReturnType<
  typeof useChannelLiveInteractionNotice
>["publishInteractionNotice"];
