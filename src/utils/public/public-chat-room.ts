// 공개 채팅방 preview와 metadata 조회를 관리합니다.
import { createClient } from "@/lib/supabase/server";
import type { PublicChatRoomMetadata } from "@/types/public/public";

export async function getPublicChatRoomMetadata(
  roomId: string,
): Promise<PublicChatRoomMetadata | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("get_public_chat_room_metadata", { p_room_id: roomId })
    .maybeSingle();

  if (error) {
    console.error("공개 채팅방 metadata 조회 실패", error);
    return null;
  }

  return data;
}
