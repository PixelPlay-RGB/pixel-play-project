// 채팅방 목록 페이지를 렌더링합니다.
import ChatRoomList from "@/components/chat-room-list/chat-room-list";

export default function ChatPage() {
  return (
    <div className="h-app-content overflow-auto p-4 md:p-6">
      <ChatRoomList />
    </div>
  );
}
