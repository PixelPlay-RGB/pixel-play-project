import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/query-keys";
import { createClient } from "@/lib/supabase/client";
import type { RoomMemberQuery } from "@/types/chat-room-member";

export function useRoomMembers(roomId: string) {
  const supabase = createClient();

  return useQuery<RoomMemberQuery[]>({
    queryKey: QUERY_KEYS.chat.members(roomId),
    enabled: !!roomId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_room_member")
        .select("*, user:user_id!inner(nickname, photo_url)")
        .eq("chat_room_id", roomId)
        .eq("is_banned", false)
        .not("last_joined_at", "is", null)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return data ?? [];
    },
  });
}
