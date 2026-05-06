"use server";

import { createClient } from "@/lib/supabase/server";
import type { CreateChatRoomInput } from "@/lib/zod/chat-room";
import { revalidatePath } from "next/cache";

export const createChatRoomAction = async (formData: CreateChatRoomInput) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "인증 정보가 없습니다." };
  }

  const { data: dbUser, error: userError } = await supabase
    .from("user")
    .select("id")
    .eq("oauth_id", user.id)
    .single();

  if (userError || !dbUser) {
    return { error: "사용자 정보를 찾을 수 없습니다." };
  }

  const { data: room, error: roomError } = await supabase
    .from("chat_room")
    .insert({
      title: formData.title,
      max_capacity: formData.capacity,
      owner_id: dbUser.id,
      description: formData.description ?? null,
    })
    .select("id")
    .single();

  if (roomError || !room) {
    return { error: "채팅방 생성에 실패했습니다." };
  }

  const { error: memberError } = await supabase.from("chat_room_member").insert({
    chat_room_id: room.id,
    user_id: dbUser.id,
  });

  if (memberError) {
    return { error: "채팅방 참여 정보 생성에 실패했습니다." };
  }

  revalidatePath("/");
  return { error: null };
};
