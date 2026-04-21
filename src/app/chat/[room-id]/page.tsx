import { ChatRoom } from "@/component/chat/chat-room"

export default async function Page(props: PageProps<"/chat/[room-id]">) {
  const { "room-id": roomId } = await props.params

  return <ChatRoom roomId={roomId} />
}
