"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";

import { ChatRoomMenu } from "@/components/chat/chat-room-menu";
import { ChatRoomJoinDialog } from "@/components/chat/chat-room-join-dialog";
import { MemberList } from "@/components/member/member-list";
import { KickedRoomAlertDialog } from "@/components/member/kicked-room-alert-dialog";
import { MessageInput } from "@/components/message/message-input";
import { MessageList } from "@/components/message/message-list";
import { Spinner } from "@/components/ui/spinner";
import { QUERY_KEYS } from "@/constants/query-keys";
import { useRoom } from "@/hooks/use-chat-room";
import { useChatRoomMemberRealtime } from "@/hooks/use-chat-room-member-realtime";
import { useChatRoomEntryStatus, type DialogEntryStatus } from "@/hooks/use-chat-room-entry-status";
import useMessages from "@/hooks/use-messages";
import { useUser } from "@/hooks/use-profile";
import { useRoomMembers } from "@/hooks/use-room-members";
import { useAuthStore } from "@/stores/auth";

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
  const queryClient = useQueryClient();
  const authUser = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const { data: profile, isPending: profilePending } = useUser();
  const { status: entryStatus } = useChatRoomEntryStatus(roomId);
  const roomQuery = useRoom(roomId);

  const isActive = entryStatus === "active";

  const { messages, hasMorePrevious, isLoadingPrevious, fetchPreviousPage, isLoadingInitial } =
    useMessages(roomId, isActive);
  const { data: members = [] } = useRoomMembers(roomId, isActive);

  const currentUserId = profile?.id ?? "";
  const { isKicked } = useChatRoomMemberRealtime({ roomId, currentUserId });

  const handleLoadPrevious = (): boolean => {
    if (isLoadingPrevious || !hasMorePrevious) return false;
    void fetchPreviousPage();
    return true;
  };

  const handleJoinSuccess = () => {
    queryClient.setQueryData(QUERY_KEYS.chat.entryStatus(roomId, authUser?.id), {
      is_banned: false,
      last_joined_at: new Date().toISOString(),
    });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.members(roomId) });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.room(roomId) });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.rooms() });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.counts() });
  };

  // auth 로딩 중, entry status 조회 중, 또는 비활성 멤버인데 방 정보 조회 중
  if (authLoading || entryStatus === "loading" || (!isActive && roomQuery.isPending)) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-950">
        <Spinner className="text-muted-foreground size-8" />
      </div>
    );
  }

  // auth 미인증 (page.tsx의 서버 redirect로 정상 흐름에선 도달 안 함)
  if (entryStatus === "unauthenticated") {
    return <ChatRoomError message="로그인이 필요합니다." />;
  }

  // 비활성 멤버 → dialog 표시
  if (!isActive) {
    const roomNotFound = roomQuery.isFetched && (roomQuery.error != null || roomQuery.data == null);
    const dialogStatus: DialogEntryStatus = roomNotFound
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

  // 활성 멤버인데 방이 없는 경우
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
