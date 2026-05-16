"use client";

// 채팅방 상세 화면에서 공통으로 사용하는 방과 멤버십 상태를 조립하는 훅

import { useRoom } from "@/hooks/use-chat-room";
import { useCurrentChatRoomMembership } from "@/hooks/use-current-chat-room-membership";
import { useUser } from "@/hooks/use-profile";

export function useChatRoomDetail(roomId: string) {
  const { data: currentUser, isPending: profilePending } = useUser();
  const currentUserId = currentUser?.id ?? "";
  const roomQuery = useRoom(roomId);
  const membershipQuery = useCurrentChatRoomMembership({ roomId, currentUserId });

  const room = roomQuery.data ?? null;
  const membership = membershipQuery.membership;
  const isJoined = membershipQuery.isJoined;
  const isKicked = membershipQuery.isKicked;
  const isFull = room != null && room.current_member >= room.max_capacity;
  const isOwner = room != null && currentUserId === room.owner_id;
  const canManageMembers = isOwner;
  const canFetchMessages = isJoined;
  const canMarkRoomRead =
    !!roomId &&
    !profilePending &&
    !!currentUserId &&
    roomQuery.isFetched &&
    room != null &&
    roomQuery.error == null &&
    !isKicked &&
    isJoined;
  const canSendMessage = !profilePending && !!currentUserId && isJoined && !isKicked;
  const shouldShowJoinDialog =
    membershipQuery.membershipFetched &&
    roomQuery.isFetched &&
    room != null &&
    !isJoined &&
    !isKicked;
  const canRequestJoin = shouldShowJoinDialog && !isFull;
  const roomMissing = !!roomId && roomQuery.isFetched && (roomQuery.error != null || room == null);

  return {
    currentUser,
    currentUserId,
    profilePending,
    room,
    roomPending: roomQuery.isPending,
    roomFetched: roomQuery.isFetched,
    roomMissing,
    membership,
    membershipFetched: membershipQuery.membershipFetched,
    isJoined,
    isKicked,
    isFull,
    isOwner,
    canManageMembers,
    canFetchMessages,
    canMarkRoomRead,
    canSendMessage,
    shouldShowJoinDialog,
    canRequestJoin,
  };
}
