// 채팅방 상세 페이지를 렌더링합니다.
import { getPublicChatRoomMetadata } from "@/actions/public/public-chat-room";
import { ChatRoom } from "@/components/chat-room/chat-room";
import ChatRoomPreview from "@/components/preview/chat-room-preview";
import { getCurrentProfileSnapshot } from "@/utils/profile/profile-server";
import type { Metadata } from "next";

const CHAT_ROOM_METADATA_FALLBACK_TITLE = "채팅방";
const CHAT_ROOM_METADATA_FALLBACK_DESCRIPTION = "PixelPlay 채팅방에서 실시간 메시지를 즐겨보세요.";

export async function generateMetadata(props: PageProps<"/chat/room/[roomId]">): Promise<Metadata> {
  const { roomId } = await props.params;
  const room = await getPublicChatRoomMetadata(roomId);

  const title = room?.title?.trim() || CHAT_ROOM_METADATA_FALLBACK_TITLE;
  const description = room?.description?.trim() || CHAT_ROOM_METADATA_FALLBACK_DESCRIPTION;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | PixelPlay`,
      description,
      url: `/chat/room/${roomId}`,
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
      title: `${title} | PixelPlay`,
      description,
      images: ["/og-chat-room.webp"],
    },
  };
}

export default async function Page(props: PageProps<"/chat/room/[roomId]">) {
  const { roomId } = await props.params;
  const [{ profile }, room] = await Promise.all([
    getCurrentProfileSnapshot(),
    getPublicChatRoomMetadata(roomId),
  ]);

  if (!profile) {
    return <ChatRoomPreview roomId={roomId} room={room} />;
  }

  return <ChatRoom roomId={roomId} />;
}
