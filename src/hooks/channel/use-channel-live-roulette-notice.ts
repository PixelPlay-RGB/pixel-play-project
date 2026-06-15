"use client";
// 방송인 룰렛 결과를 live_message에 저장하지 않고 Next.js SSE로 전송 요청합니다.

import { useCallback } from "react";

import { sendChannelLiveRouletteNoticeAction } from "@/actions/channel/live";
import type { LiveRouletteSsePublishPayload } from "@/utils/live/live-roulette-sse";

export function useChannelLiveRouletteNotice(broadcastId: string | null) {
  const publishRouletteNotice = useCallback(
    async (payload: LiveRouletteSsePublishPayload) => {
      if (!broadcastId) return false;

      try {
        const result = await sendChannelLiveRouletteNoticeAction({
          broadcastId,
          payload,
        });

        return result.success;
      } catch (error) {
        console.error("Live roulette notice publish failed", error);
        return false;
      }
    },
    [broadcastId],
  );

  return { publishRouletteNotice };
}

export type PublishRouletteNotice = ReturnType<
  typeof useChannelLiveRouletteNotice
>["publishRouletteNotice"];
