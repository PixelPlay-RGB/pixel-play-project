"use client";

// 채팅방 메시지 목록과 메시지 입력 영역을 조립하는 컴포넌트

import { MessageInput } from "@/components/chat-room/message/message-input";
import { MessageList } from "@/components/chat-room/message/message-list";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { useRoom } from "@/hooks/use-chat-room";
import { useCurrentChatRoomMemberRow } from "@/hooks/use-current-chat-room-member-row";
import { useMarkRoomReadLifecycle } from "@/hooks/use-mark-room-read-lifecycle";
import useMessages from "@/hooks/use-messages";
import { useUser } from "@/hooks/use-profile";
import { getAppMessage } from "@/utils/app-message";

interface Props {
  roomId: string;
}

export function ChatRoomMessageSection({ roomId }: Props) {
  const { data: profile, isPending: profilePending } = useUser();
  const currentUserId = profile?.id ?? "";
  const roomQuery = useRoom(roomId);
  const { isKicked, isJoined } = useCurrentChatRoomMemberRow({ roomId, currentUserId });
  const { messages, hasMorePrevious, isLoadingPrevious, fetchPreviousPage, isLoadingInitial } =
    useMessages(roomId, isJoined);

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

  const inputLocked = profilePending || !currentUserId || !isJoined;

  return (
    <>
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
    </>
  );
}
