"use server";

import { createClient } from "@/lib/supabase/server";
import type { CreateChatRoomInput } from "@/lib/zod/chat-room";
import { revalidatePath } from "next/cache";

// 채팅방 생성
export const createChatRoomAction = async (formData: CreateChatRoomInput) => {
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getUser();

  if (authError || !data.user) {
    return { error: "인증 정보가 없습니다." };
  }
  const user = data.user;

  const { data: room, error: roomError } = await supabase
    .from("chat_room")
    .insert({
      title: formData.title,
      max_capacity: formData.capacity,
      owner_id: user.id,
      description: formData.description ?? null,
    })
    .select("id")
    .single();

  if (roomError || !room) {
    return { error: "채팅방 생성에 실패했습니다." };
  }

  const { error: memberError } = await supabase.from("chat_room_member").insert({
    chat_room_id: room.id,
    user_id: user.id,
    last_joined_at: new Date().toISOString(),
  });

  if (memberError) {
    await supabase.from("chat_room").delete().eq("id", room.id);
    return { error: "채팅방 참여 정보 생성에 실패했습니다." };
  }

  revalidatePath("/");
  return { error: null };
};

// 현재 로그인 유저를 지정한 채팅방의 멤버로 등록
export const joinChatRoomAction = async (chatRoomId: string) => {
  if (!chatRoomId) {
    return { error: "잘못된 요청입니다." };
  }

  const supabase = await createClient();

  // join_chat_room RPC: auth.uid() 내부 사용 → 밴/재입장/정원 확인 → insert/update 원자 처리
  const { data: result, error: rpcError } = await supabase.rpc("join_chat_room", {
    p_chat_room_id: chatRoomId,
  });

  if (rpcError) {
    return { error: "채팅방 입장에 실패했습니다." };
  }

  if (result === "full") {
    return { error: "정원이 가득 찬 채팅방입니다." };
  }

  if (result === "ok") {
    return { error: null };
  }

  return { error: "채팅방 입장에 실패했습니다." };
};
