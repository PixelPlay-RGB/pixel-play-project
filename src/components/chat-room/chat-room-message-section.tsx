"use client";

// 채팅방 메시지 목록과 메시지 입력 영역을 조립하는 컴포넌트

import { MessageInput } from "@/components/chat-room/message/message-input";
import { MessageList } from "@/components/chat-room/message/message-list";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { useChatRoomDetail } from "@/hooks/use-chat-room-detail";
import { useChatRoomReadLifecycle } from "@/hooks/use-chat-room-read-lifecycle";
import useMessages from "@/hooks/use-messages";
import { getAppMessage } from "@/utils/app-message";

interface Props {
  roomId: string;
}

export function ChatRoomMessageSection({ roomId }: Props) {
  const { currentUserId, isKicked, canFetchMessages, canMarkRoomRead, canSendMessage } =
    useChatRoomDetail(roomId);
  const { messages, hasMorePrevious, isLoadingPrevious, fetchPreviousPage, isLoadingInitial } =
    useMessages(roomId, canFetchMessages);

  useChatRoomReadLifecycle({ roomId, enabled: canMarkRoomRead });

  const handleLoadPrevious = (): boolean => {
    if (isLoadingPrevious || !hasMorePrevious) {
      return false;
    }

    void fetchPreviousPage();
    return true;
  };

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
        disabled={!canSendMessage}
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
