"use client";

import { QUERY_KEYS } from "@/constants/query-keys";
import { useUser } from "@/hooks/use-profile";
import { createClient } from "@/lib/supabase/client";
import type { ChatRoomCounts } from "@/types/chat-room";
import { useQuery } from "@tanstack/react-query";

export function useChatRoomCounts() {
  const { data: currentUser } = useUser();

  return useQuery<ChatRoomCounts>({
    queryKey: QUERY_KEYS.chat.counts(currentUser?.id),
    queryFn: async () => {
      const supabase = createClient();
      
      // maybeSingle(): 결과가 0행이면 null, 1행이면 객체 반환 (@supabase/supabase-js v2+)
      const { data, error } = await supabase.rpc("get_room_counts_by_user", {
        p_user_id: currentUser!.id,
      }).maybeSingle();

      if (error) throw error;
      if (!data) return { JOINED: 0, NOT_JOINED: 0, OWNED: 0 };

      // 각 탭의 count 기준은 get_rooms_by_tab RPC와 동일해야 한다.
      // - JOINED:     내가 멤버로 참여 중인 방
      // - NOT_JOINED: 내가 참여하지 않은 방
      // - OWNED:      내가 개설한 방
      return {
        JOINED: data.joined,
        NOT_JOINED: data.not_joined,
        OWNED: data.owned,
      };
    },
    enabled: !!currentUser?.id,
    staleTime: 1000 * 30, // 탭 이동 시 자주 갱신되므로 30초 유지
  });
}
