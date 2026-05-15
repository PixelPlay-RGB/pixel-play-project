import { ChatRoom } from "@/components/chat-room/chat-room";

export default async function Page(props: PageProps<"/chat-room/[roomId]">) {
  const { roomId } = await props.params;

  return <ChatRoom roomId={roomId} />;
}
