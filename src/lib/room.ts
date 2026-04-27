import { createClient } from "./supabase/client";

export interface ChatRoom {
  id: string;
  title: string;
  description?: string | null;
  max_capacity: number;
  owner_id: string;
  created_at: string;
  owner?: {
    nickname: string;
  };
  member_cnt?: number;
  is_joined?: boolean;
}

const supabase = createClient();

export const getRooms = async (userId?: string) => {
  // chatroom 조회
  const { data: rooms, error: roomError } = await supabase
    .from("chatroom")
    .select("*")
    .order("created_at", { ascending: false });

  if (roomError || !rooms) return { data: null, error: roomError };

  // 방장들의 ID 리스트 조회
  const ownerIds = Array.from(new Set(rooms.map(r => r.owner_id)));
  
  // user에서 nickname 조회
  const { data: owners } = await supabase
    .from("user")
    .select("id, nickname")
    .in("id", ownerIds);

  // 채팅방에 들어간 인원수 조회
  const { data: members } = await supabase
    .from("chatroommember")
    .select("chat_room_id, user_id")
    .eq("status", "JOINED");

  const formattedRooms = rooms.map((room) => ({
    ...room,
    owner: { nickname: owners?.find(u => u.id === room.owner_id)?.nickname || "Unknown" },
    member_cnt: members?.filter(m => m.chat_room_id === room.id).length || 0,
    is_joined: userId ? members?.some(m => m.chat_room_id === room.id && m.user_id === userId) : false
  })) as ChatRoom[];

  return { data: formattedRooms, error: null };
};

export const createRoom = async (title: string, maxCapacity: number, ownerId: string, description?: string | null) => {
  if (!ownerId) 
  {
    return { data: null, error: { message: "로그인 정보가 유효하지 않습니다." } };
  }

  // 채팅방 생성
  const { data: roomData, error: roomError } = await supabase
    .from("chatroom")
    .insert({
      title: title,
      max_capacity: maxCapacity,
      owner_id: ownerId,
      description: description,
    })
    .select("*");

  if (roomError || !roomData || roomData.length === 0) {
    return { data: null, error: roomError };
  }

  // 채팅방 방장 생성
  const { error: memberError } = await supabase
    .from("chatroommember")
    .insert({
      chat_room_id: roomData[0].id,
      user_id: ownerId,
      status: "JOINED",
    });

  if (memberError)
  {
    console.error("방장 멤버 등록 실패:", memberError);
  }

  return { data: roomData, error: null };
};