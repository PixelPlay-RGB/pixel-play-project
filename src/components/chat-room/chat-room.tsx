"use client";
// chat-room 컴포넌트를 제공합니다.

import { useState } from "react";

import { ChatRoomDialogs } from "@/components/chat-room/chat-room-dialogs";
import { ChatRoomError } from "@/components/chat-room/chat-room-error";
import { ChatRoomHeader } from "@/components/chat-room/chat-room-header";
import { ChatRoomMemberSheet } from "@/components/chat-room/chat-room-member-sheet";
import { ChatRoomMemberSidebar } from "@/components/chat-room/chat-room-member-sidebar";
import { ChatRoomMessageSection } from "@/components/chat-room/chat-room-message-section";
import { ChatRoomPresenceProvider } from "@/components/chat-room/chat-room-presence-provider";
import { Spinner } from "@/components/ui/spinner";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { useChatRoomDetail } from "@/hooks/chat-room/use-chat-room-detail";
import { useChatRoomDetailRealtimeInvalidation } from "@/hooks/chat-room/use-chat-room-detail-realtime-invalidation";

interface Props {
  roomId: string;
}

export function ChatRoom({ roomId }: Props) {
  const {
    currentUser,
    currentUserId,
    profileErrorCode,
    profilePending,
    roomMissing,
    isJoined,
    isKicked,
  } = useChatRoomDetail(roomId);
  const [membersSheetOpen, setMembersSheetOpen] = useState(false);

  useChatRoomDetailRealtimeInvalidation({ roomId, currentUserId });

  if (profilePending) {
    return (
      <div className="bg-background flex h-full w-full items-center justify-center">
        <Spinner className="text-muted-foreground size-8" />
      </div>
    );
  }

  if (profileErrorCode) {
    return <ChatRoomError code={profileErrorCode} />;
  }

  if (!roomId) {
    return <ChatRoomError code={APP_MESSAGE_CODE.error.chatRoom.missingRoomId} />;
  }

  if (roomMissing) {
    return <ChatRoomError code={APP_MESSAGE_CODE.error.chatRoom.notFoundOrLoadFailed} />;
  }

  return (
    <ChatRoomPresenceProvider
      roomId={roomId}
      currentUser={currentUser ?? null}
      enabled={isJoined && !isKicked}
    >
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
    </ChatRoomPresenceProvider>
  );
}
