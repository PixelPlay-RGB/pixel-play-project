// 새 메시지 INSERT 시 채팅방 목록·안읽음 관련 React Query를 무효화합니다.
"use client";

import { QUERY_KEYS } from "@/constants/query-keys";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useChatRoomsUnreadRealtime() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`chat-rooms-unread:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "message" }, () => {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.list() });
      })
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [userId, queryClient]);
}
