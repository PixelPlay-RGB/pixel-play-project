"use server";

import { createClient } from "@/lib/supabase/server";
import type { CreateChatRoomInput } from "@/lib/zod/chat-room";
import type { AppActionResult } from "@/types/app-message";
import { revalidatePath } from "next/cache";

export const createChatRoomAction = async (
  formData: CreateChatRoomInput,
): Promise<AppActionResult> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, code: "error.chatRoom.createAuthRequired" };
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
    return { success: false, code: "error.chatRoom.createFailed" };
  }

  const { error: memberError } = await supabase.from("chat_room_member").insert({
    chat_room_id: room.id,
    user_id: user.id,
  });

  if (memberError) {
    return { success: false, code: "error.chatRoom.createMemberFailed" };
  }

  revalidatePath("/");
  return { success: true, code: "success.chatRoom.created" };
};
