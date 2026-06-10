"use client";
// 라이브 방송 크리에이터의 이번 주 후원 랭킹을 조회합니다.

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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

export function useLiveDonationRanking(creatorId: string) {
  const supabase = useMemo(() => createClient(), []);

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

  // 후원 발생 시 갱신(invalidate)은 live_message INSERT를 단독 구독하는 use-live-messages가
  // 일원화해 처리한다(같은 테이블 중복 구독 방지). 여기서는 별도 채널을 열지 않는다.
  // ⚠️ 따라서 이 훅 단독으로는 realtime 갱신이 안 된다 — 같은 화면에 use-live-messages가
  // 동일 creatorId로 마운트돼 있어야 신선도가 유지된다(현재 use-live-broadcast-view가 둘 다 마운트).
  // 랭킹 단독 위젯(예: 오버레이)에서 재사용할 땐 여기에 자체 구독을 다시 마련할 것.

  return {
    donations: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
