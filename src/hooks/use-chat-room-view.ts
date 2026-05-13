"use client";
// 채팅방 상세 뷰에 필요한 데이터·핸들러를 통합 관리하는 훅

import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { joinChatRoomAction } from "@/actions/chat-room";
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
  const rejoinAttemptedRoomRef = useRef<string | null>(null);
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

  const handleJoinSuccess = useCallback(() => {
    queryClient.setQueryData(QUERY_KEYS.chat.entryStatus(roomId, authUser?.id), {
      is_banned: false,
      last_joined_at: new Date().toISOString(),
    });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.members(roomId) });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.room(roomId) });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.rooms() });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.counts() });
  }, [authUser?.id, queryClient, roomId]);

  const rejoinMutation = useMutation({
    mutationFn: async (targetRoomId: string) => {
      const result = await joinChatRoomAction(targetRoomId);
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      handleJoinSuccess();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "채팅방 재입장 중 오류가 발생했습니다.");
    },
  });

  useEffect(() => {
    if (entryStatus !== "left" || !roomId || rejoinAttemptedRoomRef.current === roomId) return;

    rejoinAttemptedRoomRef.current = roomId;
    rejoinMutation.mutate(roomId);
  }, [entryStatus, rejoinMutation, roomId]);

  const isCurrentRoomRejoin = rejoinMutation.variables === roomId;

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
    isRejoining: isCurrentRoomRejoin && rejoinMutation.isPending,
    rejoinError: isCurrentRoomRejoin && rejoinMutation.isError,
    handleLoadPrevious,
    handleJoinSuccess,
  };
}
