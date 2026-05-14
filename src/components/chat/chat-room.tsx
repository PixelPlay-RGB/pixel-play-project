"use client";

import Link from "next/link";

import { ChatRoomMenu } from "@/components/chat/chat-room-menu";
import { MemberList } from "@/components/member/member-list";
import { KickedRoomAlertDialog } from "@/components/member/kicked-room-alert-dialog";
import { MessageInput } from "@/components/message/message-input";
import { MessageList } from "@/components/message/message-list";
import { Spinner } from "@/components/ui/spinner";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import type { AppMessageCode } from "@/constants/app-message-code";
import { useRoom } from "@/hooks/use-chat-room";
import { useChatRoomMemberRealtime } from "@/hooks/use-chat-room-member-realtime";
import { useMarkRoomReadLifecycle } from "@/hooks/use-mark-room-read-lifecycle";
import useMessages from "@/hooks/use-messages";
import { useUser } from "@/hooks/use-profile";
import { useRoomMembers } from "@/hooks/use-room-members";
import { getAppMessage } from "@/utils/app-message";

interface Props {
  roomId: string;
}

function ChatRoomError({ code }: { code: AppMessageCode }) {
  const message = getAppMessage(code);

  return (
    <div className="dark flex h-full min-h-0 flex-col items-center justify-center gap-3 bg-zinc-950 px-4 text-center text-zinc-200">
      <p className="text-sm">{message.title}</p>
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

  const currentUserId = profile?.id ?? "";
  const { isKicked } = useChatRoomMemberRealtime({ roomId, currentUserId });

  const markRoomReadEnabled =
    !!roomId &&
    !profilePending &&
    !!currentUserId &&
    roomQuery.isFetched &&
    roomQuery.data != null &&
    roomQuery.error == null &&
    !isKicked;

  useMarkRoomReadLifecycle({ roomId, enabled: markRoomReadEnabled });

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
    return <ChatRoomError code={APP_MESSAGE_CODE.error.chatRoom.missingRoomId} />;
  }

  const roomMissing =
    !!roomId && roomQuery.isFetched && (roomQuery.error != null || roomQuery.data == null);
  if (roomMissing) {
    return <ChatRoomError code={APP_MESSAGE_CODE.error.chatRoom.notFoundOrLoadFailed} />;
  }

  const inputLocked = profilePending || !currentUserId;

  return (
    <div className="dark text-foreground flex h-full min-h-0 w-full flex-col overflow-hidden bg-zinc-950 md:flex-row">
      <MemberList
        roomId={roomId}
        currentUserId={currentUserId}
        ownerId={roomQuery.data?.owner_id}
      />

      <aside className="bg-background flex min-h-0 flex-1 flex-col border-white/10 md:w-[min(100%,380px)] md:shrink-0 md:border-l">
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
                  currentMember={roomQuery.data.current_member}
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
          disabledHint={
            getAppMessage(
              isKicked
                ? APP_MESSAGE_CODE.error.chatRoom.isKicked
                : APP_MESSAGE_CODE.error.chatRoom.inputLocked,
            ).title
          }
        />
      </aside>

      <KickedRoomAlertDialog open={isKicked} />
    </div>
  );
}
