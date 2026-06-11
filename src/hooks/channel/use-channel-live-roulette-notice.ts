"use client";
// 방송인 룰렛 결과를 live_message에 저장하지 않고 Next.js SSE로 전송 요청합니다.

import { useCallback } from "react";

import { sendChannelLiveRouletteNoticeAction } from "@/actions/channel/live";
import type { LiveRouletteSsePayload } from "@/utils/live/live-roulette-sse";

export function useChannelLiveRouletteNotice(broadcastId: string | null) {
  const publishRouletteNotice = useCallback(
    async (payload: LiveRouletteSsePayload) => {
      if (!broadcastId) return false;

      const result = await sendChannelLiveRouletteNoticeAction({
        broadcastId,
        payload,
      });

      return result.success;
    },
    [broadcastId],
  );

  return { publishRouletteNotice };
}

export type PublishRouletteNotice = ReturnType<
  typeof useChannelLiveRouletteNotice
>["publishRouletteNotice"];
