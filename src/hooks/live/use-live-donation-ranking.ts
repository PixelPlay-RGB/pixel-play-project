"use client";
// 라이브 방송 크리에이터의 이번 주 후원 랭킹을 조회합니다.

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getLiveDonationRankingAction } from "@/actions/live/live";
import { createClient } from "@/lib/supabase/client";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { LIVE_LABEL } from "@/constants/live/live";
import type { LiveDonation } from "@/types/live/live";

function normalizeDonationRanking(
  donations: { id: string; author: string | null; amount: number; message: string }[],
): LiveDonation[] {
  return donations.map((donation) => ({
    id: donation.id,
    author: donation.author ?? LIVE_LABEL.anonymousAuthor,
    amount: donation.amount,
    message: donation.message,
  }));
}

export function useLiveDonationRanking(
  creatorId: string,
  broadcastId: string | null | undefined,
) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEYS.donations.liveRanking(creatorId),
    enabled: !!creatorId,
    staleTime: 1000 * 30,
    queryFn: async () => {
      const result = await getLiveDonationRankingAction(creatorId);

      if (!result.success || !result.data) {
        console.error("라이브 후원 랭킹 조회 액션 실패", result.code);
        return [];
      }

      return normalizeDonationRanking(result.data.donations);
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
