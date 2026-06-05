"use client";
// 로그인한 사용자의 지갑 잔액을 조회하는 훅입니다.

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { QUERY_KEYS } from "@/constants/common/query-keys";

function extractWalletBalance(data: unknown): number {
  if (typeof data !== "object" || data === null || !("wallet" in data)) return 0;
  const wallet = (data as { wallet: unknown }).wallet;
  if (typeof wallet !== "object" || wallet === null || !("balanceAmount" in wallet)) return 0;
  const balance = (wallet as { balanceAmount: unknown }).balanceAmount;
  return typeof balance === "number" ? balance : 0;
}

export function useUserWalletBalance(userId: string | null | undefined) {
  const client = useMemo(() => createClient(), []);

  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.donations.walletBalance(userId ?? undefined),
    enabled: !!userId,
    staleTime: 1000 * 30,
    queryFn: async () => {
      const { data, error } = await client.rpc("get_user_donation_snapshot", {
        p_actor_user_id: userId!,
      });
      if (error) throw error;
      return data;
    },
  });

  return { walletBalance: extractWalletBalance(data), isLoading, isError };
}
