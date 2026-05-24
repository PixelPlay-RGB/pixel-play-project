// 채팅방 목록 페이지를 렌더링합니다.
import ChatRoomList from "@/components/chat-room-list/chat-room-list";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "채팅",
  description: "PixelPlay 채팅방을 만들고 참여하며 실시간 대화를 이어가세요.",
  openGraph: {
    title: "채팅 | PixelPlay",
    description: "PixelPlay 채팅방을 만들고 참여하며 실시간 대화를 이어가세요.",
    url: "/chat",
    images: [
      {
        url: "/og-chat-room.webp",
        width: 1200,
        height: 630,
        alt: "PixelPlay 채팅방 썸네일",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "채팅 | PixelPlay",
    description: "PixelPlay 채팅방을 만들고 참여하며 실시간 대화를 이어가세요.",
    images: ["/og-chat-room.webp"],
  },
};

export default function ChatPage() {
  return (
    <div className="flex w-full flex-1 flex-col px-4 py-6 sm:px-6 md:py-8 lg:px-8 2xl:px-10">
      <ChatRoomList />
    </div>
  );
}
