import { ChatRoom } from "@/components/chat/chat-room";
import { notFound, redirect } from "next/navigation";
import { getChatRoomPrecheck } from "./precheck";

export default async function Page(props: PageProps<"/chat/[room-id]">) {
  const { "room-id": roomId } = await props.params;
  const precheck = await getChatRoomPrecheck(roomId);

  if (precheck.status === "unauthenticated") {
    redirect("/auth/login");
  }

  if (precheck.status === "not_found") {
    notFound();
  }

  return <ChatRoom roomId={roomId} initialView={precheck.initialView} />;
}
