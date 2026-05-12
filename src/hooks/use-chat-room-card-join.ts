"use client";
// ChatRoomCard의 NOT_JOINED 입장 플로우(entry status 조회·라우팅·캐시 무효화)를 관리하는 훅

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/query-keys";
import { useChatRoomEntryStatus, type DialogEntryStatus } from "@/hooks/use-chat-room-entry-status";
import type { ChatRoomTab } from "@/types/chat-room";

const DIALOG_STATUSES: readonly string[] = ["new", "left", "banned", "error"];

interface Params {
  chatRoomId: string;
  currentUserId?: string;
  tabType: ChatRoomTab;
}

export function useChatRoomCardJoin({ chatRoomId, currentUserId, tabType }: Params) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const shouldConfirmJoin = tabType === "NOT_JOINED";

  // 카드 클릭 시에만 lazy하게 조회 — 목록 전체에서 미리 조회하지 않기 위해 enabled로 제어
  const { status: entryStatus } = useChatRoomEntryStatus(chatRoomId, {
    enabled: shouldConfirmJoin && showJoinDialog,
  });

  const isLoadingEntry = showJoinDialog && entryStatus === "loading";
  const dialogVisible = showJoinDialog && DIALOG_STATUSES.includes(entryStatus);

  // active: 이미 입장된 방 → 모달 없이 바로 이동
  // unauthenticated: 세션 만료 → 로그인 페이지로 이동
  useEffect(() => {
    if (!showJoinDialog || entryStatus === "loading") return;
    if (entryStatus === "active") router.push(`/chat/${chatRoomId}`);
    else if (entryStatus === "unauthenticated") router.push("/auth/login");
  }, [showJoinDialog, entryStatus, router, chatRoomId]);

  const handleClick = () => {
    if (shouldConfirmJoin) {
      setShowJoinDialog(true);
      return;
    }
    router.push(`/chat/${chatRoomId}`);
  };

  const handleJoinSuccess = () => {
    queryClient.setQueryData(QUERY_KEYS.chat.entryStatus(chatRoomId, currentUserId), {
      is_banned: false,
      last_joined_at: new Date().toISOString(),
    });
    // JOINED/NOT_JOINED 탭 모두 갱신이 필요하므로 tabType 없이 userId 단위로 무효화
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.rooms(currentUserId) });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.counts(currentUserId) });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.room(chatRoomId) });
    router.push(`/chat/${chatRoomId}`);
  };

  return {
    isLoadingEntry,
    dialogVisible,
    dialogStatus: entryStatus as DialogEntryStatus,
    handleClick,
    handleJoinSuccess,
    onCancelDialog: () => setShowJoinDialog(false),
  };
}
