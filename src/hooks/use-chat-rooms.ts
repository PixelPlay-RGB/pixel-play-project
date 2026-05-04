"use client";

import { createClient } from "@/lib/supabase/client";
import { ChatRoom } from "@/lib/room";
import { useUser } from "@/hooks/use-profile";
import { useQuery } from "@tanstack/react-query";

export const CHAT_ROOMS_QUERY_KEY = ["chatrooms"] as const;

const fetchRooms = async (currentUserId: string): Promise<ChatRoom[]> => {
  const supabase = createClient();

  // 1. chatroom → member count만 조회
  const { data: rooms, error } = await supabase
    .from("chatroom")
    .select(`
      id, title, description, max_capacity, owner_id, created_at,
      members:chatroommember(count)
    `)
    .eq("chatroommember.status", "JOINED");

  if (error) {
    console.error("채팅방 목록 조회 실패:", error);
    return [];
  }
  if (!rooms || rooms.length === 0) return [];

  // 2. owner_id 목록으로 닉네임 일괄 조회
  const ownerIds = [...new Set(rooms.map((r) => r.owner_id))];
  const { data: owners, error: ownerError } = await supabase
    .from("user")
    .select("id, nickname")
    .in("id", ownerIds);

  if (ownerError) console.error("owner 조회 실패:", ownerError);

  const ownerMap = new Map(owners?.map((o) => [o.id, o.nickname]) ?? []);

  // 현재 유저가 참여 중인 방 ID 목록 조회
  const { data: myMemberships } = await supabase
    .from("chatroommember")
    .select("chat_room_id")
    .eq("user_id", currentUserId)
    .eq("status", "JOINED");

  const joinedRoomIds = new Set(myMemberships?.map((m) => m.chat_room_id) ?? []);

  return rooms.map((room) => ({
    ...room,
    owner: { nickname: ownerMap.get(room.owner_id) ?? "Unknown" },
    member_cnt: (room.members as { count: number }[])[0]?.count ?? 0,
    is_joined: joinedRoomIds.has(room.id),
  }));
};

export function useChatRooms() {
  const { data: currentUser } = useUser();

  return useQuery<ChatRoom[]>({
    queryKey: [...CHAT_ROOMS_QUERY_KEY, currentUser?.id],
    queryFn: () => fetchRooms(currentUser!.id),
    enabled: !!currentUser?.id,
  });
}
