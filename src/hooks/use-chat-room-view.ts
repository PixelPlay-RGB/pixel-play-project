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
import type { ChatRoomInitialView } from "@/types/chat-room-entry";

interface UseChatRoomViewOptions {
  initialView?: ChatRoomInitialView;
}

export function useChatRoomView(roomId: string, options?: UseChatRoomViewOptions) {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((s) => s.user);
  const initialView = options?.initialView;
  const entryStatusUserId = authUser?.id ?? initialView?.userId;
  const rejoinAttemptedRoomRef = useRef<string | null>(null);
  const { data: profile, isPending: profilePending } = useUser();
  const { status: queriedEntryStatus } = useChatRoomEntryStatus(roomId, {
    initialData: initialView?.entryMembership,
    initialUserId: initialView?.userId,
  });
  const roomQuery = useRoom(roomId, { initialData: initialView?.room });
  const entryStatus =
    queriedEntryStatus === "loading" && initialView?.entryStatus
      ? initialView.entryStatus
      : queriedEntryStatus;

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
    queryClient.setQueryData(QUERY_KEYS.chat.entryStatus(roomId, entryStatusUserId), {
      is_banned: false,
      last_joined_at: new Date().toISOString(),
    });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.members(roomId) });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.room(roomId) });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.rooms() });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.counts() });
  }, [entryStatusUserId, queryClient, roomId]);

  const {
    mutate: rejoinRoom,
    variables: rejoinRoomId,
    isPending: isRejoiningPending,
    isError: isRejoiningError,
  } = useMutation({
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
    rejoinRoom(roomId);
  }, [entryStatus, rejoinRoom, roomId]);

  const isCurrentRoomRejoin = rejoinRoomId === roomId;

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
    isRejoining: isCurrentRoomRejoin && isRejoiningPending,
    rejoinError: isCurrentRoomRejoin && isRejoiningError,
    handleLoadPrevious,
    handleJoinSuccess,
  };
}
