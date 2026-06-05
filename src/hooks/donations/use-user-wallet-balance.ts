"use client";
// 로그인한 사용자의 지갑 잔액을 조회하는 훅입니다.

import { useQuery } from "@tanstack/react-query";
import { getUserWalletBalanceAction } from "@/actions/live/live";
import { QUERY_KEYS } from "@/constants/common/query-keys";

export function useUserWalletBalance(userId: string | null | undefined) {
  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.donations.walletBalance(userId ?? undefined),
    enabled: !!userId,
    staleTime: 1000 * 30,
    queryFn: async () => {
      const result = await getUserWalletBalanceAction();

      if (!result.success || !result.data) {
        throw new Error(result.code ?? "wallet balance load failed");
      }

      return result.data.walletBalance;
    },
  });

  return { walletBalance: data ?? 0, isLoading, isError };
}
