import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { RoomMemberQuery } from "@/types/chatroommember";

export function useRoomMembers(roomId: string) {
  const supabase = createClient();

  return useQuery<RoomMemberQuery[]>({
    queryKey: ["room-members", roomId],
    enabled: !!roomId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_room_member")
        .select(
          "chat_room_id, user_id, created_at, user:user_id(nickname, photo_url)",
        )
        .eq("chat_room_id", roomId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return data as unknown as RoomMemberQuery[];
    },
  });
}
