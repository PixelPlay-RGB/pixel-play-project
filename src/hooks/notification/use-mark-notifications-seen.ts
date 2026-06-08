"use client";
// 수신함을 열 때 호출 → last_seen 갱신 → 배지 안읽음 수를 0으로 만듭니다.
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { markNotificationsSeenAction } from "@/actions/notification/notification";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { useAuthStore } from "@/stores/auth";

export function useMarkNotificationsSeen() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: () => markNotificationsSeenAction(),
    onSuccess: (result) => {
      if (!result.success) return;
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notification.lastSeen(userId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notification.unreadCount(userId) });
    },
  });
}
