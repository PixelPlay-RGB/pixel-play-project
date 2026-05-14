"use client";

// leave_chat_room RPC 호출 후 채팅 관련 쿼리를 무효화하고 홈으로 이동하는 mutation 훅

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { QUERY_KEYS } from "@/constants/query-keys";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function useLeaveChatRoom() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (roomId: string) => {
      const supabase = createClient();
      const { error } = await supabase.rpc("leave_chat_room", { p_room_id: roomId });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("채팅방을 나갔습니다.");
      router.push("/");
      queryClient.removeQueries({ queryKey: QUERY_KEYS.chat.room() });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.chat.messages() });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.chat.members() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.rooms() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.counts() });
    },
  });
}
