// 라우트 페이지를 렌더링합니다.
import { ChatRoom } from "@/components/chat-room/chat-room";

export default async function Page(props: PageProps<"/chat-room/[roomId]">) {
  const { roomId } = await props.params;

  return <ChatRoom roomId={roomId} />;
}
