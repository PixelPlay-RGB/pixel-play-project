"use client";
// 라이브 메시지 초기 조회 + Realtime INSERT 구독 훅입니다.
// 메시지 읽기는 RLS로 anon·authenticated 모두 허용됩니다.
// 메시지 전송 권한(canChat)은 viewerChatState와 sendLiveMessageAction에서 검증합니다.

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import type { LiveChatMessage } from "@/types/live/live";

const LIVE_MESSAGE_LIMIT = 100;

interface LiveMessageRow {
  id: string;
  message_type: "chat" | "moderation_notice" | "donation";
  content: string;
  sender: { nickname: string; photo_url: string | null } | null;
  donation: { amount: number } | null;
}

function mapRowToMessage(row: LiveMessageRow): LiveChatMessage {
  if (row.message_type === "donation") {
    return {
      id: row.id,
      type: "donation",
      author: row.sender?.nickname ?? "익명",
      content: row.content,
      donationAmount: row.donation?.amount,
    };
  }
  if (row.message_type === "moderation_notice") {
    return {
      id: row.id,
      type: "system",
      content: row.content,
    };
  }
  return {
    id: row.id,
    type: "text",
    author: row.sender?.nickname ?? "익명",
    content: row.content,
  };
}

export function useLiveMessages(broadcastId: string | null | undefined) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const enabled = !!broadcastId;

  const query = useQuery<LiveChatMessage[]>({
    queryKey: QUERY_KEYS.live.messages(broadcastId ?? undefined),
    enabled,
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("live_message")
        .select(
          "id, message_type, content, sender:sender_id(nickname, photo_url), donation:donation_id(amount)",
        )
        .eq("broadcast_id", broadcastId!)
        .order("created_at", { ascending: true })
        .limit(LIVE_MESSAGE_LIMIT);

      if (error) throw error;

      return (data ?? []).map((row) => mapRowToMessage(row as unknown as LiveMessageRow));
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

          const { data: row, error } = await supabase
            .from("live_message")
            .select(
              "id, message_type, content, sender:sender_id(nickname, photo_url), donation:donation_id(amount)",
            )
            .eq("id", messageId)
            .single();

          if (error || !row) return;

          const nextMessage = mapRowToMessage(row as unknown as LiveMessageRow);

          queryClient.setQueryData<LiveChatMessage[]>(
            QUERY_KEYS.live.messages(broadcastId),
            (prev) => {
              if (!prev) return [nextMessage];
              if (prev.some((m) => m.id === nextMessage.id)) return prev;
              return [...prev, nextMessage];
            },
          );
        },
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [broadcastId, supabase, queryClient]);

  return query.data ?? [];
}
