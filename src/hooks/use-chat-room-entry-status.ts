"use client";
// 채팅방 진입 전 membership 상태(신규/재입장/밴/활성)를 조회해 EntryStatus로 반환

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/query-keys";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth";
import type { ChatRoomEntryMembership, EntryStatus } from "@/types/chat-room-entry";

interface UseChatRoomEntryStatusOptions {
  enabled?: boolean;
  initialData?: ChatRoomEntryMembership | null;
  initialUserId?: string;
}

export function useChatRoomEntryStatus(roomId: string, options?: UseChatRoomEntryStatusOptions) {
  const authUser = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const supabase = createClient();
  // 서버 precheck 결과가 다른 사용자 캐시에 섞이지 않도록 userId 일치 여부 확인
  const canUseInitialData = options?.initialUserId === authUser?.id;

  const query = useQuery<ChatRoomEntryMembership | null>({
    queryKey: QUERY_KEYS.chat.entryStatus(roomId, authUser?.id),
    enabled: !!roomId && !authLoading && !!authUser && (options?.enabled ?? true),
    initialData: canUseInitialData ? options?.initialData : undefined,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_room_member")
        .select("is_banned, last_joined_at")
        .eq("chat_room_id", roomId)
        .eq("user_id", authUser!.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const status: EntryStatus = (() => {
    if (query.isPending) return "loading";
    if (query.isError) return "error";
    const membership = query.data;
    if (!membership) return "new";
    if (membership.is_banned) return "banned";
    if (membership.last_joined_at === null) return "left";
    return "active";
  })();

  return { status, query };
}
