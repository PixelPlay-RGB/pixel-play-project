import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ChatRoom } from "@/components/chat/chat-room";
import { ChatRoomJoinDialog } from "@/components/chat/chat-room-join-dialog";

export default async function Page(props: PageProps<"/chat/[room-id]">) {
  const { "room-id": roomId } = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // 멤버십 조회와 방 정보 조회를 병렬로 실행해 waterfall을 방지
  const [{ data: membership, error: membershipError }, { data: room }] = await Promise.all([
    // 현재 유저가 해당 채팅방의 멤버인지 확인 — 결과에 따라 dialog 노출 여부를 결정
    supabase
      .from("chat_room_member")
      .select("id")
      .eq("chat_room_id", roomId)
      .eq("user_id", user.id)
      .maybeSingle(),
    // dialog에 방 제목을 즉시 표시하기 위해 서버에서 미리 조회 — 클라이언트 fetch 대기 없이 렌더
    supabase.from("chat_room").select("title").eq("id", roomId).maybeSingle(),
  ]);

  // 조회 실패 시 멤버 여부를 확인할 수 없으므로 홈으로 이동
  if (membershipError) {
    redirect("/");
  }

  // !room: 존재하지 않는 방 — ChatRoom이 자체적으로 에러 처리
  // membership: 이미 멤버 — dialog 없이 바로 진입
  if (!room || membership) {
    return <ChatRoom roomId={roomId} />;
  }

  // 입장 확인 dialog를 먼저 표시
  return <ChatRoomJoinDialog roomId={roomId} roomTitle={room.title} />;
}
