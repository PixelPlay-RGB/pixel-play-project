"use client";

import Link from "next/link";
import { useMemo } from "react";

import { ChatRoomMenu } from "@/components/chat/chat-room-menu";
import { MemberList } from "@/components/member/member-list";
import { MessageInput } from "@/components/message/message-input";
import { MessageList } from "@/components/message/message-list";
import { Spinner } from "@/components/ui/spinner";
import { useRoom } from "@/hooks/use-chat-room";
import useMessages from "@/hooks/use-messages";
import { useUser } from "@/hooks/use-profile";
import { useRoomMembers } from "@/hooks/use-room-members";

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
  const { data: profile, isPending: profilePending } = useUser();
  const { messages, hasMorePrevious, isLoadingPrevious, fetchPreviousPage, isLoadingInitial } =
    useMessages(roomId);

  const roomQuery = useRoom(roomId);

  const { data: members = [] } = useRoomMembers(roomId);

  const memberDisplayByUserId = useMemo(() => {
    const map: Record<string, { nickname: string; photoUrl: string | null }> = {};
    for (const m of members) {
      map[m.user_id] = {
        nickname: m.user?.nickname || m.user_id.slice(0, 8),
        photoUrl: m.user?.photo_url ?? null,
      };
    }
    return map;
  }, [members]);

  const currentUserId = profile?.id ?? "";

  const handleLoadPrevious = (): boolean => {
    if (isLoadingPrevious || !hasMorePrevious) {
      return false;
    }

    void fetchPreviousPage();
    return true;
  };

  if (profilePending) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-950">
        <Spinner className="text-muted-foreground size-8" />
      </div>
    );
  }

  if (!roomId) {
    return <ChatRoomError message=" 방 정보가 없습니다." />;
  }

  const roomMissing =
    !!roomId && roomQuery.isFetched && (roomQuery.error != null || roomQuery.data == null);
  if (roomMissing) {
    return <ChatRoomError message="존재하지 않는 채팅방이거나 불러올 수 없습니다." />;
  }

  const inputLocked = profilePending || !currentUserId;

  return (
    <div className="dark text-foreground flex h-full min-h-0 w-full flex-col overflow-hidden bg-zinc-950 md:flex-row">
      <MemberList roomId={roomId} />

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
          memberDisplayByUserId={memberDisplayByUserId}
          hasMorePrevious={hasMorePrevious}
          isLoadingPrevious={isLoadingPrevious || isLoadingInitial}
          onReachTop={handleLoadPrevious}
        />

        <MessageInput
          roomId={roomId}
          currentUserId={currentUserId}
          disabled={inputLocked}
          disabledHint={profilePending ? "프로필을 불러오는 중입니다." : "로그인 후 이용할 수 있습니다."}
        />
      </aside>
    </div>
  );
}
