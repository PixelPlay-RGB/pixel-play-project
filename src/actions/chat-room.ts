"use server";

import { createClient } from "@/lib/supabase/server";
import type { CreateChatRoomInput } from "@/lib/zod/chat-room";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import type { AppActionResult } from "@/types/action";
import { revalidatePath } from "next/cache";

export const createChatRoomAction = async (
  formData: CreateChatRoomInput,
): Promise<AppActionResult> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, code: APP_MESSAGE_CODE.error.chatRoom.createAuthRequired };
  }

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
    if (roomError) console.error("채팅방 생성 중 방 정보 저장 실패", roomError);
    return { success: false, code: APP_MESSAGE_CODE.error.chatRoom.createFailed };
  }

  const { error: memberError } = await supabase.from("chat_room_member").insert({
    chat_room_id: room.id,
    user_id: user.id,
  });

  if (memberError) {
    console.error("채팅방 생성 중 참여 정보 저장 실패", memberError);
    const { error: rollbackError } = await supabase.from("chat_room").delete().eq("id", room.id);

    if (rollbackError) {
      console.error("채팅방 생성 실패 후 방 정보 롤백 실패", rollbackError);
    }

    return { success: false, code: APP_MESSAGE_CODE.error.chatRoom.createMemberFailed };
  }

  revalidatePath("/");
  return { success: true, code: APP_MESSAGE_CODE.success.chatRoom.created };
};
