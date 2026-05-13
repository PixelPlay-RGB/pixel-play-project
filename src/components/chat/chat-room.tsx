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
import type { DialogEntryStatus } from "@/hooks/use-chat-room-entry-status";
import { useChatRoomView } from "@/hooks/use-chat-room-view";

interface Props {
  roomId: string;
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

export function ChatRoom({ roomId }: Props) {
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
    handleLoadPrevious,
    handleJoinSuccess,
  } = useChatRoomView(roomId);

  // 비활성 멤버의 경우 다이얼로그에 방 제목을 표시하기 위해 roomQuery 완료 대기
  if (entryStatus === "loading" || (!isActive && roomQuery.isPending)) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-950">
        <Spinner className="text-muted-foreground size-8" />
      </div>
    );
  }

  if (!isActive) {
    const roomNotFound = roomQuery.isFetched && roomQuery.error == null && roomQuery.data == null;
    const dialogStatus: DialogEntryStatus = roomQuery.error
      ? "error"
      : roomNotFound
        ? "room_not_found"
        : (entryStatus as DialogEntryStatus);

    return (
      <ChatRoomJoinDialog
        roomId={roomId}
        roomTitle={roomQuery.data?.title ?? null}
        status={dialogStatus}
        onJoinSuccess={handleJoinSuccess}
      />
    );
  }

  const roomMissing = roomQuery.isFetched && (roomQuery.error != null || roomQuery.data == null);
  if (roomMissing) {
    return <ChatRoomError message="존재하지 않는 채팅방이거나 불러올 수 없습니다." />;
  }

  const inputLocked = profilePending || !currentUserId;

  return (
    <div className="dark text-foreground flex h-full min-h-0 w-full flex-col overflow-hidden bg-zinc-950 md:flex-row">
      <MemberList
        roomId={roomId}
        currentUserId={currentUserId}
        ownerId={roomQuery.data?.owner_id}
      />

      <aside className="bg-background flex min-h-0 flex-1 flex-col border-white/10 md:w-full md:max-w-95 md:flex-none md:border-l">
        <header className="border-border shrink-0 border-b px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <h1 className="line-clamp-2 flex-1 text-sm leading-tight font-semibold">
              {roomQuery.isPending ? "불러오는 중…" : (roomQuery.data?.title ?? "채팅방")}
            </h1>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-muted-foreground text-xs">{members.length}명</span>
              {roomQuery.data ? (
                <ChatRoomMenu
                  roomId={roomId}
                  ownerId={roomQuery.data.owner_id}
                  currentUserId={currentUserId}
                />
              ) : null}
            </div>
          </div>
          <p className="text-muted-foreground mt-1 line-clamp-1 text-[11px]">
            {roomQuery.data?.description ?? ""}
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
