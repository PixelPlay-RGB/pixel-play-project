import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { RoomMemberQuery } from "@/types/chat";

export function useRoomMembers(roomId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["room-members", roomId],
    enabled: !!roomId,
    queryFn: async (): Promise<RoomMemberQuery[]> => {
      const { data, error } = await supabase
        .from("chatroommember")
        .select("chat_room_id, user_id, created_at, user:user_id(nickname)")
        .eq("chat_room_id", roomId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return data as RoomMemberQuery[];
    },
  });
}
