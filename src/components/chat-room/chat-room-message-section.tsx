"use client";
// 채팅방 메시지 목록과 메시지 입력 영역을 조립하는 컴포넌트

import { MessageInput } from "@/components/chat-room/message/message-input";
import { MessageList } from "@/components/chat-room/message/message-list";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { useChatRoomDetail } from "@/hooks/chat-room/use-chat-room-detail";
import { useChatRoomReadLifecycle } from "@/hooks/chat-room/use-chat-room-read-lifecycle";
import useMessages from "@/hooks/message/use-messages";
import { removeOptimisticMessage, useSendMessage } from "@/hooks/message/use-send-message";
import { getAppMessage } from "@/utils/app-message";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  roomId: string;
}

export function ChatRoomMessageSection({ roomId }: Props) {
  const queryClient = useQueryClient();
  const sendMessageMutation = useSendMessage(roomId);
  const { currentUserId, isKicked, canFetchMessages, canMarkRoomRead, canSendMessage } =
    useChatRoomDetail(roomId);
  const { messages, hasMorePrevious, isLoadingPrevious, fetchPreviousPage, isLoadingInitial } =
    useMessages(roomId, canFetchMessages);

  useChatRoomReadLifecycle({ roomId, enabled: canMarkRoomRead });

  const handleRetryFailedSend = (messageId: string, content: string) => {
    void sendMessageMutation.mutateAsync({ content, reuseMessageId: messageId });
  };

  const handleCancelFailedSend = (messageId: string) => {
    removeOptimisticMessage(queryClient, roomId, messageId);
  };

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
        onRetryFailedSend={handleRetryFailedSend}
        onCancelFailedSend={handleCancelFailedSend}
        isSendMutationPending={sendMessageMutation.isPending}
      />

      <MessageInput
        roomId={roomId}
        sendMessageMutation={sendMessageMutation}
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
