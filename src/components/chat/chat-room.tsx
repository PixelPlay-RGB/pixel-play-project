"use client";
// 입장 상태에 따라 로딩·참가 모달·채팅 UI를 분기 렌더링하는 채팅방 컴포넌트

import Link from "next/link";

import { ChatRoomMenu } from "@/components/chat/chat-room-menu";
import { ChatRoomJoinDialog } from "@/components/chat/chat-room-join-dialog";
import { MemberList } from "@/components/member/member-list";
import { KickedRoomAlertDialog } from "@/components/member/kicked-room-alert-dialog";
import { MessageInput } from "@/components/message/message-input";
import { MessageList } from "@/components/message/message-list";
import { Spinner } from "@/components/ui/spinner";
import { useChatRoomView } from "@/hooks/use-chat-room-view";
import type { ChatRoomInitialView, DialogEntryStatus } from "@/types/chat-room-entry";

interface Props {
  roomId: string;
  initialView?: ChatRoomInitialView;
}

function ChatRoomError({ message }: { message: string }) {
  return (
    <div className="dark flex h-full min-h-0 flex-col items-center justify-center gap-3 bg-zinc-950 px-4 text-center text-zinc-200">
      <p className="text-sm">{message}</p>
      <Link href="/" className="text-sm underline">
        처음으로
      </Link>
    </div>
  );
}

export function ChatRoom({ roomId, initialView }: Props) {
  const {
    entryStatus,
    isActive,
    roomQuery,
    messages,
    members,
    hasMorePrevious,
    isLoadingPrevious,
    isLoadingInitial,
    currentUserId,
    profilePending,
    isKicked,
    isRejoining,
    rejoinError,
    handleLoadPrevious,
    handleJoinSuccess,
  } = useChatRoomView(roomId, {
    initialView,
  });

  if (
    entryStatus === "loading" ||
    (entryStatus === "left" && !rejoinError) ||
    (!isActive && roomQuery.isPending)
  ) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-950">
        <Spinner className="text-muted-foreground size-8" />
      </div>
    );
  }

  const roomMissing = roomQuery.isFetched && (roomQuery.error != null || roomQuery.data == null);
  if (roomMissing) {
    return <ChatRoomError message="존재하지 않는 채팅방이거나 불러올 수 없습니다." />;
  }

  const room = roomQuery.data;
  if (!room) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-950">
        <Spinner className="text-muted-foreground size-8" />
      </div>
    );
  }

  if (rejoinError) {
    return <ChatRoomError message="채팅방에 다시 입장하지 못했습니다." />;
  }

  if (entryStatus === "banned") {
    return <ChatRoomError message="입장이 제한된 채팅방입니다." />;
  }

  if (entryStatus === "error") {
    return <ChatRoomError message="채팅방 입장 상태를 불러오지 못했습니다." />;
  }

  if (entryStatus === "new") {
    const isFull = room.current_member >= room.max_capacity;
    const dialogStatus: DialogEntryStatus = isFull ? "full" : "new";
    return (
      <ChatRoomJoinDialog
        roomId={roomId}
        roomTitle={room.title}
        status={dialogStatus}
        onJoinSuccess={handleJoinSuccess}
      />
    );
  }

  if (!isActive || isRejoining) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-950">
        <Spinner className="text-muted-foreground size-8" />
      </div>
    );
  }

  const inputLocked = profilePending || !currentUserId;

  return (
    <div className="dark text-foreground flex h-full min-h-0 w-full flex-col overflow-hidden bg-zinc-950 md:flex-row">
      <MemberList
        roomId={roomId}
        currentUserId={currentUserId}
        ownerId={room.owner_id}
      />

      <aside className="bg-background flex min-h-0 flex-1 flex-col border-white/10 md:w-full md:max-w-95 md:flex-none md:border-l">
        <header className="border-border shrink-0 border-b px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <h1 className="line-clamp-2 flex-1 text-sm leading-tight font-semibold">
              {room.title}
            </h1>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-muted-foreground text-xs">{members.length}명</span>
              <ChatRoomMenu roomId={roomId} ownerId={room.owner_id} currentUserId={currentUserId} />
            </div>
          </div>
          <p className="text-muted-foreground mt-1 line-clamp-1 text-[11px]">
            {room.description ?? ""}
          </p>
        </header>

        <MessageList
          key={roomId}
          messages={messages}
          currentUserId={currentUserId}
          hasMorePrevious={hasMorePrevious}
          isLoadingPrevious={isLoadingPrevious || isLoadingInitial}
          onReachTop={handleLoadPrevious}
        />

        <MessageInput
          roomId={roomId}
          currentUserId={currentUserId}
          disabled={inputLocked || isKicked}
          disabledHint={isKicked ? "강퇴당한 방입니다." : "메시지를 보낼 수 없습니다."}
        />
      </aside>

      <KickedRoomAlertDialog open={isKicked} />
    </div>
  );
}
