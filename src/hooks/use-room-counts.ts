"use client";

import { QUERY_KEYS } from "@/constants/query-keys";
import { useUser } from "@/hooks/use-profile";
import { createClient } from "@/lib/supabase/client";
import type { ChatRoomTab } from "@/types/chat-room";
import { useQuery } from "@tanstack/react-query";

// 모든 탭 키가 항상 존재하는 타입 (로딩 중 여부는 쿼리 반환값 자체가 undefined인지로 판단)
export type RoomCounts = Record<ChatRoomTab, number>;

export function useRoomCounts() {
  const { data: currentUser } = useUser();

  return useQuery<RoomCounts>({
    queryKey: QUERY_KEYS.chat.counts(currentUser?.id),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_room_counts_by_user", {
        p_user_id: currentUser!.id,
      });
      if (error) throw error;

      const row = data?.[0];
      if (!row) return { JOINED: 0, NOT_JOINED: 0, OWNED: 0 };

      // 각 탭의 count 기준은 get_rooms_by_tab RPC와 동일해야 한다.
      // - JOINED:     내가 멤버로 참여 중인 방
      // - NOT_JOINED: 내가 참여하지 않은 방
      // - OWNED:      내가 개설한 방
      return {
        JOINED: row.joined,
        NOT_JOINED: row.not_joined,
        OWNED: row.owned,
      };
    },
    enabled: !!currentUser?.id,
    staleTime: 1000 * 30, // 탭 이동 시 자주 갱신되므로 30초 유지
  });
}
