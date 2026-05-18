"use client";
// 채팅방 상세 화면의 참여와 강퇴 상태 Dialog를 조립하는 컴포넌트

import { JoinChatRoomDialog } from "@/components/chat-room/join-chat-room-dialog";
import { KickedRoomAlertDialog } from "@/components/chat-room/member/kicked-room-alert-dialog";
import { useChatRoomDetail } from "@/hooks/chat-room/use-chat-room-detail";

interface Props {
  roomId: string;
}

export function ChatRoomDialogs({ roomId }: Props) {
  const { room, isKicked, isFull, shouldShowJoinDialog, canRequestJoin } =
    useChatRoomDetail(roomId);

  return (
    <>
      <KickedRoomAlertDialog open={isKicked} />
      <JoinChatRoomDialog
        open={shouldShowJoinDialog}
        roomId={roomId}
        roomTitle={room?.title ?? ""}
        isFull={isFull}
        canRequestJoin={canRequestJoin}
      />
    </>
  );
}
