// 데스크톱 채팅방 참여자 사이드바를 표시하는 컴포넌트

import { MemberList } from "@/components/chat-room/member/member-list";

interface Props {
  roomId: string;
}

export function ChatRoomMemberSidebar({ roomId }: Props) {
  return (
    <div className="hidden shrink-0 md:flex">
      <MemberList roomId={roomId} />
    </div>
  );
}
