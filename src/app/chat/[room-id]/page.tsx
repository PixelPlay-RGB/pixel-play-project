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
    // is_banned, last_joined_at으로 활성 멤버 여부를 판별 — row 존재만으로는 활성 상태를 알 수 없음
    supabase
      .from("chat_room_member")
      .select("is_banned, last_joined_at")
      .eq("chat_room_id", roomId)
      .eq("user_id", user.id)
      .maybeSingle(),
    // dialog에 방 제목을 즉시 표시하기 위해 서버에서 미리 조회 — 클라이언트 fetch 대기 없이 렌더
    supabase.from("chat_room").select("title").eq("id", roomId).maybeSingle(),
  ]);

  // 조회 실패 또는 밴 유저: 홈으로 이동
  if (membershipError || membership?.is_banned) {
    redirect("/");
  }

  // !room: 존재하지 않는 방 — ChatRoom이 자체적으로 에러 처리
  // 활성 멤버(is_banned=false, last_joined_at IS NOT NULL): dialog 없이 바로 진입
  const isActiveMember = !!membership && membership.last_joined_at !== null;
  if (!room || isActiveMember) {
    return <ChatRoom roomId={roomId} />;
  }

  // 신규 또는 나간 유저 — 입장 확인 dialog 표시
  return <ChatRoomJoinDialog roomId={roomId} roomTitle={room.title} />;
}
