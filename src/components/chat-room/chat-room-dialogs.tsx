"use client";

// 채팅방 상세 화면의 참여와 강퇴 상태 Dialog를 조립하는 컴포넌트

import { JoinChatRoomDialog } from "@/components/chat-room/join-chat-room-dialog";
import { KickedRoomAlertDialog } from "@/components/chat-room/member/kicked-room-alert-dialog";
import { useRoom } from "@/hooks/use-chat-room";
import { useCurrentChatRoomMemberRow } from "@/hooks/use-current-chat-room-member-row";
import { useUser } from "@/hooks/use-profile";

interface Props {
  roomId: string;
}

export function ChatRoomDialogs({ roomId }: Props) {
  const { data: profile } = useUser();
  const currentUserId = profile?.id ?? "";
  const roomQuery = useRoom(roomId);
  const { isKicked, isJoined, membershipFetched } = useCurrentChatRoomMemberRow({
    roomId,
    currentUserId,
  });
  const room = roomQuery.data;
  const isFull = room != null && room.current_member >= room.max_capacity;
  const shouldShowJoinDialog =
    membershipFetched && roomQuery.isFetched && room != null && !isJoined && !isKicked;

  return (
    <>
      <KickedRoomAlertDialog open={isKicked} />
      <JoinChatRoomDialog
        open={shouldShowJoinDialog}
        roomId={roomId}
        roomTitle={room?.title ?? ""}
        isFull={isFull}
      />
    </>
  );
}
