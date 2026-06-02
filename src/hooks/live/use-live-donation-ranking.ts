"use client";
// 라이브 방송 크리에이터의 이번 주 후원 랭킹을 조회합니다.

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { LIVE_LABEL } from "@/constants/live/live";
import { isUuid } from "@/utils/common/uuid";
import type { LiveDonation } from "@/types/live/live";

function normalizeDonationRanking(raw: unknown): LiveDonation[] {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    if (typeof record.id !== "string" || typeof record.amount !== "number") return [];

    return [
      {
        id: record.id,
        author: typeof record.author === "string" ? record.author : LIVE_LABEL.anonymousAuthor,
        amount: record.amount,
      },
    ];
  });
}

export function useLiveDonationRanking(creatorId: string, broadcastId: string | null | undefined) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEYS.donations.liveRanking(creatorId),
    enabled: isUuid(creatorId),
    staleTime: 1000 * 30,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_live_donation_ranking", {
        p_creator_id: creatorId,
      });

      if (error) {
        console.error("get_live_donation_ranking 실패", error);
        return [];
      }

      return normalizeDonationRanking(data);
    },
  });

  useEffect(() => {
    if (!broadcastId) return;

    const channel = supabase
      .channel(`live-donation-ranking-${broadcastId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_message",
          filter: `broadcast_id=eq.${broadcastId}`,
        },
        (payload) => {
          if (!payload.new || typeof payload.new !== "object") return;
          const messageType = String((payload.new as Record<string, unknown>).message_type ?? "");
          if (messageType !== "donation") return;

          void queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.donations.liveRanking(creatorId),
          });
        },
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [broadcastId, creatorId, supabase, queryClient]);

  return {
    donations: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
