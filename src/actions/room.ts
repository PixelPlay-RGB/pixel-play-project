"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export const createRoomAction = async (formData: {
  title: string;
  capacity: number;
  description?: string;
}) => {
  const supabase = await createClient();

  // 서버에서 직접 유저 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "인증 정보가 없습니다." };

  const { data: dbUser } = await supabase
    .from("user")
    .select("id")
    .eq("oauth_id", user.id)
    .single();

  if (!dbUser) return { error: "사용자 정보를 찾을 수 없습니다." };

  const { data: room, error: roomError } = await supabase
    .from("chat_room")
    .insert({
      title: formData.title,
      max_capacity: formData.capacity,
      owner_id: dbUser.id,
      description: formData.description ?? null,
    })
    .select()
    .single();

  if (roomError || !room) return { error: "채팅방생성에 실패했습니다." };

  await supabase.from("chat_room_member").insert({
    chat_room_id: room.id,
    user_id: dbUser.id,
  });

  revalidatePath("/");
  return { error: null };
};
