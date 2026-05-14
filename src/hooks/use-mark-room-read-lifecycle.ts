// 채팅방 진입·이탈 시 last_read_at을 갱신하는 훅
"use client";

import { useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/query-keys";
import { createClient } from "@/lib/supabase/client";

interface Options {
  roomId: string;
  /** 프로필·방 메타가 준비되고 존재하는 방일 때만 true */
  enabled: boolean;
}

function invalidateChatQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.all });
}

export function useMarkRoomReadLifecycle({ roomId, enabled }: Options) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !roomId) {
      return;
    }

    const id = roomId;
    const supabase = createClient();

    const mark = () => {
      void supabase.rpc("mark_room_read", { p_room_id: id }).then(({ error }) => {
        if (error) {
          console.error("mark_room_read failed", error);
          return;
        }
        invalidateChatQueries(queryClient);
      });
    };

    mark();

    return () => {
      mark();
    };
  }, [enabled, roomId, queryClient]);
}
