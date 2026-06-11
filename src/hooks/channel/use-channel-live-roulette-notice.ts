"use client";
// 방송인 룰렛 결과를 live_message에 저장하지 않고 Realtime broadcast로 전송합니다.

import { useCallback, useMemo } from "react";

import {
  getLiveRouletteBroadcastTopic,
  LIVE_ROULETTE_BROADCAST_EVENT,
} from "@/constants/live/live-roulette-broadcast";
import { createClient } from "@/lib/supabase/client";
import type { LiveRouletteNoticePayload } from "@/types/channel/live-interaction";

export function useChannelLiveRouletteNotice(broadcastId: string | null) {
  const supabase = useMemo(() => createClient(), []);

  const publishRouletteNotice = useCallback(
    async (payload: LiveRouletteNoticePayload) => {
      if (!broadcastId) return false;

      const channel = supabase.channel(getLiveRouletteBroadcastTopic(broadcastId), {
        config: { broadcast: { ack: true } },
      });
      const result = await channel.send({
        type: "broadcast",
        event: LIVE_ROULETTE_BROADCAST_EVENT,
        payload,
      });

      void supabase.removeChannel(channel);

      return result === "ok";
    },
    [broadcastId, supabase],
  );

  return { publishRouletteNotice };
}

export type PublishRouletteNotice = ReturnType<
  typeof useChannelLiveRouletteNotice
>["publishRouletteNotice"];
