// 라우트 페이지를 렌더링합니다.
import { ChatRoom } from "@/components/chat-room/chat-room";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

const CHAT_ROOM_METADATA_FALLBACK_TITLE = "채팅방";
const CHAT_ROOM_METADATA_FALLBACK_DESCRIPTION =
  "PixelPlay 채팅방에서 실시간 메시지와 참여자 상호작용을 즐겨보세요.";

export async function generateMetadata(props: PageProps<"/chat-room/[roomId]">): Promise<Metadata> {
  const { roomId } = await props.params;
  const supabase = await createClient();
  const { data: room, error } = await supabase
    .from("chat_room")
    .select("title, description")
    .eq("id", roomId)
    .maybeSingle();

  if (error) {
    console.error("채팅방 metadata 조회 실패", error);
  }

  const title = room?.title?.trim() || CHAT_ROOM_METADATA_FALLBACK_TITLE;
  const description = room?.description?.trim() || CHAT_ROOM_METADATA_FALLBACK_DESCRIPTION;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | PixelPlay`,
      description,
      url: `/chat-room/${roomId}`,
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

export default async function Page(props: PageProps<"/chat-room/[roomId]">) {
  const { roomId } = await props.params;

  return <ChatRoom roomId={roomId} />;
}
