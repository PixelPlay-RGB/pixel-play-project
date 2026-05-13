"use client";
// 채팅방 상세 뷰에 필요한 데이터·핸들러를 통합 관리하는 훅

import { useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/query-keys";
import { useRoom } from "@/hooks/use-chat-room";
import { useChatRoomMemberRealtime } from "@/hooks/use-chat-room-member-realtime";
import { useChatRoomEntryStatus } from "@/hooks/use-chat-room-entry-status";
import useMessages from "@/hooks/use-messages";
import { useUser } from "@/hooks/use-profile";
import { useRoomMembers } from "@/hooks/use-room-members";
import { useAuthStore } from "@/stores/auth";

export function useChatRoomView(roomId: string) {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((s) => s.user);
  const { data: profile, isPending: profilePending } = useUser();
  const { status: entryStatus } = useChatRoomEntryStatus(roomId);
  const roomQuery = useRoom(roomId);

  const isActive = entryStatus === "active";

  const { messages, hasMorePrevious, isLoadingPrevious, fetchPreviousPage, isLoadingInitial } =
    useMessages(roomId, isActive);
  const { data: members = [] } = useRoomMembers(roomId, isActive);

  const currentUserId = profile?.id ?? "";
  const { isKicked } = useChatRoomMemberRealtime({ roomId, currentUserId });

  const handleLoadPrevious = (): boolean => {
    if (isLoadingPrevious || !hasMorePrevious) return false;
    void fetchPreviousPage();
    return true;
  };

  const handleJoinSuccess = () => {
    queryClient.setQueryData(QUERY_KEYS.chat.entryStatus(roomId, authUser?.id), {
      is_banned: false,
      last_joined_at: new Date().toISOString(),
    });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.members(roomId) });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.room(roomId) });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.rooms() });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.counts() });
  };

  return {
    entryStatus,
    isActive,
    roomQuery,
    messages,
    members,
    hasMorePrevious,
    isLoadingPrevious,
    isLoadingInitial,
    currentUserId,
    profilePending,
    isKicked,
    handleLoadPrevious,
    handleJoinSuccess,
  };
}
