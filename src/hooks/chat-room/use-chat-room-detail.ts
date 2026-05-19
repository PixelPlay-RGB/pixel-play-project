"use client";
// 채팅방 상세 화면에서 공통으로 사용하는 방과 멤버십 상태를 조립하는 훅

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/common/query-keys";
import { resolveProfileQueryErrorCode, useUser } from "@/hooks/profile/use-profile";
import { createClient } from "@/lib/supabase/client";
import type { ChatRoomDetailData } from "@/utils/chat-room/chat-room-detail";
import { EMPTY_CHAT_ROOM_DETAIL, parseChatRoomDetail } from "@/utils/chat-room/chat-room-detail";

async function fetchChatRoomDetail(roomId: string): Promise<ChatRoomDetailData> {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc("get_chat_room_detail", { p_room_id: roomId })
    .single();

  if (error) {
    throw error;
  }

  return parseChatRoomDetail(data);
}

export function useChatRoomDetail(roomId: string) {
  const {
    data: currentUser,
    error: profileError,
    isError: isProfileError,
    isFetched: profileFetched,
    isPending: profilePending,
  } = useUser();
  const currentUserId = currentUser?.id ?? "";
  const canQueryDetail = !!roomId && !!currentUserId && profileFetched;
  const detailQuery = useQuery<ChatRoomDetailData>({
    queryKey: QUERY_KEYS.chat.detail(roomId, currentUserId),
    queryFn: () => fetchChatRoomDetail(roomId),
    enabled: canQueryDetail,
  });

  const detail = detailQuery.data ?? EMPTY_CHAT_ROOM_DETAIL;
  const { room, membership, members } = detail;
  const isKicked = membership?.is_banned ?? false;
  const isJoined = !!membership?.last_joined_at && !membership.is_banned;
  const isFull = room != null && room.current_member >= room.max_capacity;
  const isOwner = room != null && currentUserId === room.owner_id;
  const canManageMembers = isOwner;
  const canFetchMessages = isJoined;
  const canMarkRoomRead =
    !!roomId &&
    !profilePending &&
    !!currentUserId &&
    detailQuery.isFetched &&
    room != null &&
    detailQuery.error == null &&
    !isKicked &&
    isJoined;
  const canSendMessage = !profilePending && !!currentUserId && isJoined && !isKicked;
  const shouldShowJoinDialog = detailQuery.isFetched && room != null && !isJoined && !isKicked;
  const canRequestJoin = shouldShowJoinDialog && !isFull;
  const roomMissing =
    !!roomId && detailQuery.isFetched && (detailQuery.error != null || room == null);

  return {
    currentUser,
    currentUserId,
    profilePending,
    profileErrorCode: isProfileError ? resolveProfileQueryErrorCode(profileError) : null,
    room,
    roomPending: canQueryDetail && detailQuery.isPending,
    roomFetched: detailQuery.isFetched,
    roomMissing,
    membership,
    membershipFetched: detailQuery.isFetched,
    members,
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
