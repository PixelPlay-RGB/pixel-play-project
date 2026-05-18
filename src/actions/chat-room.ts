"use server";
// chat-room Server Action을 관리합니다.

import { getAuthenticatedActorId } from "@/actions/authenticated-actor";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createChatRoomSchema } from "@/lib/zod/chat-room";
import type { CreateChatRoomInput } from "@/lib/zod/chat-room";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import type { AppActionResult } from "@/types/action";
import { isKnownChatRoomRpcError, resolveChatRoomRpcErrorCode } from "@/utils/app-message";
import { revalidatePath } from "next/cache";

export const createChatRoomAction = async (
  formData: CreateChatRoomInput,
): Promise<AppActionResult> => {
  const parsed = createChatRoomSchema.safeParse(formData);

  if (!parsed.success) {
    return { success: false, code: APP_MESSAGE_CODE.error.chatRoom.invalidInput };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "채팅방 생성 중 인증 유저 조회 실패",
    missingCode: APP_MESSAGE_CODE.error.chatRoom.createAuthRequired,
  });

  if (!actor.success) {
    return actor.result;
  }

  const supabase = createAdminClient();

  const { error } = await supabase.rpc("create_chat_room", {
    p_actor_user_id: actor.userId,
    p_title: parsed.data.title,
    p_description: parsed.data.description ?? "",
    p_max_capacity: parsed.data.capacity,
  });

  if (error) {
    if (!isKnownChatRoomRpcError(error)) {
      console.error("채팅방 생성 RPC 실패", error);
    }

    const code = resolveChatRoomRpcErrorCode(error, APP_MESSAGE_CODE.error.chatRoom.createFailed);

    return { success: false, code };
  }

  revalidatePath("/");
  return { success: true, code: APP_MESSAGE_CODE.success.chatRoom.created };
};
