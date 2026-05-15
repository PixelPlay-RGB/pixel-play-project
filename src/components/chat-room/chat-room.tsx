"use client";

import { useState } from "react";

import { ChatRoomDialogs } from "@/components/chat-room/chat-room-dialogs";
import { ChatRoomError } from "@/components/chat-room/chat-room-error";
import { ChatRoomHeader } from "@/components/chat-room/chat-room-header";
import { ChatRoomMemberSheet } from "@/components/chat-room/chat-room-member-sheet";
import { ChatRoomMemberSidebar } from "@/components/chat-room/chat-room-member-sidebar";
import { ChatRoomMessageSection } from "@/components/chat-room/chat-room-message-section";
import { Spinner } from "@/components/ui/spinner";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { useRoom } from "@/hooks/use-chat-room";
import { useChatRoomMemberRealtimeInvalidation } from "@/hooks/use-chat-room-member-realtime-invalidation";
import { useUser } from "@/hooks/use-profile";

interface Props {
  roomId: string;
}

export function ChatRoom({ roomId }: Props) {
  const { data: profile, isPending: profilePending } = useUser();
  const currentUserId = profile?.id ?? "";
  const roomQuery = useRoom(roomId);
  const [membersSheetOpen, setMembersSheetOpen] = useState(false);

  useChatRoomMemberRealtimeInvalidation({ roomId, currentUserId });

  if (profilePending) {
    return (
      <div className="bg-background flex h-full w-full items-center justify-center">
        <Spinner className="text-muted-foreground size-8" />
      </div>
    );
  }

  if (!roomId) {
    return <ChatRoomError code={APP_MESSAGE_CODE.error.chatRoom.missingRoomId} />;
  }

  const roomMissing =
    !!roomId && roomQuery.isFetched && (roomQuery.error != null || roomQuery.data == null);
  if (roomMissing) {
    return <ChatRoomError code={APP_MESSAGE_CODE.error.chatRoom.notFoundOrLoadFailed} />;
  }

  return (
    <div className="bg-background text-foreground flex h-full min-h-0 w-full overflow-hidden md:flex-row">
      <ChatRoomMemberSidebar roomId={roomId} />

      <section className="bg-background flex min-h-0 min-w-0 flex-1 flex-col">
        <ChatRoomHeader roomId={roomId} onOpenMembers={() => setMembersSheetOpen(true)} />
        <ChatRoomMessageSection roomId={roomId} />
      </section>

      <ChatRoomMemberSheet
        roomId={roomId}
        open={membersSheetOpen}
        onOpenChange={setMembersSheetOpen}
      />
      <ChatRoomDialogs roomId={roomId} />
    </div>
  );
}
