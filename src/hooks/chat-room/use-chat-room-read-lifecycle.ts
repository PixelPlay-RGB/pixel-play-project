"use client";

// 채팅방 상세 진입과 이탈 시 읽음 상태를 갱신하는 훅

import { useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { markRoomReadAction } from "@/actions/chat-room-member";
import { QUERY_KEYS } from "@/constants/query-keys";

interface Options {
  roomId: string;
  /** 프로필·방 메타가 준비되고 존재하는 방일 때만 true */
  enabled: boolean;
}

function invalidateChatQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.all });
}

export function useChatRoomReadLifecycle({ roomId, enabled }: Options) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !roomId) {
      return;
    }

    const id = roomId;

    const mark = () => {
      void markRoomReadAction(id).then((result) => {
        if (!result.success) {
          return;
        }
        invalidateChatQueries(queryClient);
      });
    };

    mark();

    return () => {
      mark();
    };
  }, [enabled, roomId, queryClient]);
}
