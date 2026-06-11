"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { LIVE_MESSAGE_LIMIT } from "@/constants/live/live";
import {
  mapLiveMessageRealtimePayload,
  mapLiveMessageRowToMessage,
  type LiveMessageRow,
} from "@/utils/live/live-message";
import { appendLiveMessage } from "@/utils/live/live-chat";
import type { LiveChatMessage } from "@/types/live/live";
// 닉네임·후원 금액은 metadata에 스냅샷으로 들어 있어 join이 필요 없다(Realtime payload와 동일 경로).
// user·donation join을 빼야 anon RLS("Anyone can read active live messages")만으로 비로그인도 조회된다.
const LIVE_MESSAGE_SELECT =
  "id, created_at, sender_id, message_type, content, sender_role, metadata" as const;
const EMPTY_LIVE_MESSAGES: LiveChatMessage[] = [];

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
        .returns<LiveMessageRow[]>();

      if (error) throw error;

      return (data ?? []).reverse().flatMap((row) => {
        const message = mapLiveMessageRowToMessage(row, creatorId, viewerId);

        return message ? [message] : [];
      });
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
          // 후원 메시지면 후원 랭킹도 갱신한다. live_message INSERT 구독을 메시지 훅 한 곳으로
          // 모아, 후원 랭킹 훅이 같은 테이블에 별도 채널을 또 열지 않게 한다.
          const row =
            payload.new && typeof payload.new === "object"
              ? (payload.new as Record<string, unknown>)
              : null;
          if (creatorId && row?.message_type === "donation") {
            void queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.donations.liveRanking(creatorId),
            });
          }

          // Realtime payload의 metadata로 바로 매핑한다(추가 단건 조회 없음).
          const nextMessage = mapLiveMessageRealtimePayload(payload.new, creatorId, viewerId);
          if (!nextMessage) return;

          queryClient.setQueryData<LiveChatMessage[]>(
            QUERY_KEYS.live.messages(broadcastId),
            (prev) => {
              if (!prev) return [nextMessage];
              // 본인 메시지는 낙관적 항목이 실제 id로 먼저 승격되어 있다 — 스킵하면 서버
              // 스냅샷(sender_role 등)이 반영되지 않으므로 같은 id는 서버 버전으로 교체한다.
              if (prev.some((m) => m.id === nextMessage.id)) {
                return prev.map((m) => (m.id === nextMessage.id ? nextMessage : m));
              }
              return appendLiveMessage(prev, nextMessage);
            },
          );
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // 재구독 사이의 갭에서 놓친 변경을 복구한다. live_message 구독을 이 훅으로 일원화했으므로
          // (use-live-donation-ranking 참고) 메시지뿐 아니라 후원 랭킹도 함께 복구해야 한다 —
          // viewerId(로그인) 변경으로 재구독되는 틈에 후원 INSERT가 도착하면 랭킹이 stale로 남는다.
          void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.live.messages(broadcastId) });
          if (creatorId) {
            void queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.donations.liveRanking(creatorId),
            });
          }
        }
      });

    return () => {
      void channel.unsubscribe();
    };
  }, [broadcastId, creatorId, viewerId, supabase, queryClient]);

  return {
    messages: query.data ?? EMPTY_LIVE_MESSAGES,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
