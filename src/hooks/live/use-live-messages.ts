"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { mapLiveMessageRowToMessage, type LiveMessageRow } from "@/utils/live/live-message";
import type { LiveChatMessage } from "@/types/live/live";

const LIVE_MESSAGE_LIMIT = 100;
const LIVE_MESSAGE_SELECT =
  "id, message_type, content, sender:sender_id(nickname, photo_url), donation:donation_id(amount)" as const;

export function useLiveMessages(broadcastId: string | null | undefined) {
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
        .returns<LiveMessageRow[]>();

      if (error) throw error;

      return (data ?? []).reverse().map(mapLiveMessageRowToMessage);
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
        async (payload) => {
          if (!payload.new || typeof payload.new !== "object") return;
          const messageId = String((payload.new as Record<string, unknown>).id ?? "");
          if (!messageId) return;

          // TODO [perf]: Realtime payload에는 sender/donation join 데이터가 없어 INSERT마다 단건 조회가 필요하다.
          // 트래픽이 늘면 sender 프로필 캐시 또는 별도 조회 전략으로 N+1 SELECT를 줄인다.
          const { data: row, error } = await supabase
            .from("live_message")
            .select(LIVE_MESSAGE_SELECT)
            .eq("id", messageId)
            .single()
            .returns<LiveMessageRow>();

          if (error || !row) return;

          const nextMessage = mapLiveMessageRowToMessage(row);

          queryClient.setQueryData<LiveChatMessage[]>(
            QUERY_KEYS.live.messages(broadcastId),
            (prev) => {
              if (!prev) return [nextMessage];
              if (prev.some((m) => m.id === nextMessage.id)) return prev;
              return [...prev, nextMessage].slice(-LIVE_MESSAGE_LIMIT);
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
  }, [broadcastId, supabase, queryClient]);

  return {
    messages: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
