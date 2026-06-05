"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { LIVE_MESSAGE_LIMIT } from "@/constants/live/live";
import {
  mapLiveMessageRealtimePayload,
  mapLiveMessageRowToMessage,
  type LiveMessageJoinedRow,
} from "@/utils/live/live-message";
import { appendLiveMessage } from "@/utils/live/live-chat";
import type { LiveChatMessage } from "@/types/live/live";
const LIVE_MESSAGE_SELECT =
  "id, sender_id, message_type, content, metadata, sender:sender_id(nickname, photo_url), donation:donation_id(amount)" as const;

export function useLiveMessages(
  broadcastId: string | null | undefined,
  creatorId?: string,
  viewerId?: string,
) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const enabled = !!broadcastId;

  const query = useQuery<LiveChatMessage[]>({
    queryKey: QUERY_KEYS.live.messages(broadcastId ?? undefined),
    enabled,
    staleTime: Infinity,
    queryFn: async () => {
      if (!broadcastId) throw new Error("broadcastId is required");
      const { data, error } = await supabase
        .from("live_message")
        .select(LIVE_MESSAGE_SELECT)
        .eq("broadcast_id", broadcastId)
        .order("created_at", { ascending: false })
        .limit(LIVE_MESSAGE_LIMIT)
        .returns<LiveMessageJoinedRow[]>();

      if (error) throw error;

      return (data ?? [])
        .reverse()
        .map((row) => mapLiveMessageRowToMessage(row, creatorId, viewerId));
    },
  });

  // Realtime — 새 메시지 실시간 수신
  useEffect(() => {
    if (!broadcastId) return;

    const channel = supabase
      .channel(`live-messages-${broadcastId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_message",
          filter: `broadcast_id=eq.${broadcastId}`,
        },
        (payload) => {
          // Realtime payload의 metadata로 바로 매핑한다(추가 단건 조회 없음).
          const nextMessage = mapLiveMessageRealtimePayload(payload.new, creatorId, viewerId);
          if (!nextMessage) return;

          queryClient.setQueryData<LiveChatMessage[]>(
            QUERY_KEYS.live.messages(broadcastId),
            (prev) => {
              if (!prev) return [nextMessage];
              if (prev.some((m) => m.id === nextMessage.id)) return prev;
              return appendLiveMessage(prev, nextMessage);
            },
          );
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.live.messages(broadcastId) });
        }
      });

    return () => {
      void channel.unsubscribe();
    };
  }, [broadcastId, creatorId, viewerId, supabase, queryClient]);

  return {
    messages: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
