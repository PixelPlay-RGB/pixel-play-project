"use client";

import Link from "next/link";
import { useState } from "react";
import { Users } from "lucide-react";

import { ChatRoomMenu } from "@/components/chat/chat-room-menu";
import { JoinChatRoomDialog } from "@/components/chat/join-chat-room-dialog";
import { MemberList } from "@/components/member/member-list";
import { KickedRoomAlertDialog } from "@/components/member/kicked-room-alert-dialog";
import { MessageInput } from "@/components/message/message-input";
import { MessageList } from "@/components/message/message-list";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
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
    <div className="bg-background text-foreground flex h-full min-h-0 flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-sm">{message.title}</p>
      <Link href="/" className="text-sm underline">
        처음으로
      </Link>
    </div>
  );
}

export function ChatRoom({ roomId }: Props) {
  const { data: profile, isPending: profilePending } = useUser();
  const currentUserId = profile?.id ?? "";

  const roomQuery = useRoom(roomId);
  const { isKicked, isJoined, membershipFetched } = useChatRoomMemberRealtime({ roomId, currentUserId });

  const { messages, hasMorePrevious, isLoadingPrevious, fetchPreviousPage, isLoadingInitial } =
    useMessages(roomId, isJoined);
  const { data: members = [] } = useRoomMembers(roomId, isJoined);

  const [membersSheetOpen, setMembersSheetOpen] = useState(false);

  const isFull =
    (roomQuery.data?.current_member ?? 0) >= (roomQuery.data?.max_capacity ?? 0);

  const shouldShowJoinDialog =
    membershipFetched && roomQuery.isFetched && roomQuery.data != null && !isJoined && !isKicked;

  const markRoomReadEnabled =
    !!roomId &&
    !profilePending &&
    !!currentUserId &&
    roomQuery.isFetched &&
    roomQuery.data != null &&
    roomQuery.error == null &&
    !isKicked &&
    isJoined;

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

  const inputLocked = profilePending || !currentUserId || !isJoined;

  return (
    <div className="bg-background text-foreground flex h-full min-h-0 w-full overflow-hidden md:flex-row">
      {/* PC: 좌측 고정 사이드바 */}
      <div className="hidden shrink-0 md:flex">
        <MemberList
          roomId={roomId}
          currentUserId={currentUserId}
          ownerId={roomQuery.data?.owner_id}
        />
      </div>

      <section className="bg-background flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="border-border/50 bg-muted/20 flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">
            {roomQuery.isPending ? "불러오는 중…" : (roomQuery.data?.title ?? "채팅방")}
          </h1>
          <div className="flex shrink-0 items-center gap-1.5">
            {/* 모바일: Sheet 열기 / PC: 시각적 표시 */}
            <Button
              variant="ghost"
              size={"icon-lg"}
              className="gap-1.5 md:pointer-events-none md:cursor-default"
              onClick={() => setMembersSheetOpen(true)}
              aria-label="참여자 목록"
            >
              <Users className="size-4" />
              <span className="text-sm font-medium">{members.length}</span>
            </Button>
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
      </section>

      {/* 모바일 전용 Sheet */}
      <Sheet open={membersSheetOpen} onOpenChange={setMembersSheetOpen}>
        <SheetContent side="right" className="flex w-80 flex-col gap-0 p-0">
          <SheetTitle className="sr-only">참여자 목록</SheetTitle>
          <MemberList
            roomId={roomId}
            currentUserId={currentUserId}
            ownerId={roomQuery.data?.owner_id}
            className="h-full max-h-none w-full border-r-0 md:w-full md:border-r-0"
          />
        </SheetContent>
      </Sheet>

      <KickedRoomAlertDialog open={isKicked} />

      <JoinChatRoomDialog
        open={shouldShowJoinDialog}
        roomId={roomId}
        roomTitle={roomQuery.data?.title ?? ""}
        isFull={isFull}
      />
    </div>
  );
}
