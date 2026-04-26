import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { Room } from "@/types/chat";

export function useRoom(roomId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["room", roomId],
    enabled: !!roomId,
    queryFn: async (): Promise<Room> => {
      const { data, error } = await supabase
        .from("chatroom")
        .select("*")
        .eq("id", roomId)
        .single();

      if (error) throw error;

      return data as Room;
    },
  });
}
