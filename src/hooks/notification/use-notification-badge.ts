"use client";
// 종 배지용: 마지막 확인 시각(last_seen) 이후 안읽음 수 + notification INSERT 실시간 반영.
import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/common/query-keys";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth";

export function useNotificationBadge() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  const lastSeenQuery = useQuery({
    queryKey: QUERY_KEYS.notification.lastSeen(userId),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user")
        .select("notifications_last_seen_at")
        .eq("id", userId!)
        .single();
      if (error) throw error;
      return data.notifications_last_seen_at;
    },
  });

  const lastSeen = lastSeenQuery.data ?? null;

  const unreadQuery = useQuery({
    // lastSeen을 키에 포함해야 읽음 처리(last_seen 갱신) 후 카운트가 재조회되어 배지가 0으로 떨어진다.
    queryKey: [...QUERY_KEYS.notification.unreadCount(userId), lastSeen],
    enabled: !!userId && lastSeenQuery.isFetched,
    queryFn: async () => {
      let q = supabase.from("notification").select("id", { count: "exact", head: true });
      if (lastSeen) q = q.gt("created_at", lastSeen);
      const { count, error } = await q;
      if (error) throw error;
      return count ?? 0;
    },
  });

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notification-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notification",
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.notification.unreadCount(userId),
          });
          void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notification.listAll() });
        },
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [userId, supabase, queryClient]);

  return { unreadCount: unreadQuery.data ?? 0, isLoggedIn: !!userId };
}
