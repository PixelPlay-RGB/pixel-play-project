"use client";
// 알림 수신함 목록을 created_at 내림차순 무한 스크롤로 조회합니다(RLS로 본인 수신분만).
import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/common/query-keys";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth";
import { parseNotification } from "@/utils/notification/notification-parser";

const NOTIFICATION_PAGE_SIZE = 15;

export function useNotifications(enabled: boolean) {
  const supabase = useMemo(() => createClient(), []);
  const userId = useAuthStore((s) => s.user?.id);

  return useInfiniteQuery({
    queryKey: QUERY_KEYS.notification.list(userId),
    enabled: enabled && !!userId,
    staleTime: 1000 * 30,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const from = pageParam * NOTIFICATION_PAGE_SIZE;
      const to = from + NOTIFICATION_PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("notification")
        .select("*")
        // RLS로도 본인 수신분만 보이지만, 명시적 recipient 필터로 인덱스 활용 + 정책 변경 방어.
        .eq("recipient_id", userId!)
        // 같은 created_at(동시 이벤트) 페이지 경계에서 중복/누락이 없도록 id로 안정 정렬한다.
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return (data ?? []).map(parseNotification);
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === NOTIFICATION_PAGE_SIZE ? allPages.length : undefined,
  });
}
