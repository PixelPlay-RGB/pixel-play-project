"use client";
// 강퇴/해제 realtime — 강퇴당한 당사자 브라우저에 즉시 차단/복귀를 반영한다(#119).
// channel_viewer_ban 의 RLS(당사자 본인 select 허용) + postgres_changes(banned_user_id=eq.me 필터)로
// 당사자에게만 이벤트가 전달된다. 호출부는 use-live-view-data 단독 — watch 캐시를 단독 소유하므로
// 메인 시청 화면과 채팅 팝아웃이 같은 캐시를 보고 자동으로 함께 차단/복귀된다.

import { useEffect } from "react";

import type { QueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/common/query-keys";
import type { createClient } from "@/lib/supabase/client";
import type { LiveWatchData } from "@/types/live/live";

interface Params {
  supabase: ReturnType<typeof createClient>;
  queryClient: QueryClient;
  creatorId: string;
  // 로그인 유저 id. 비로그인(null)은 강퇴 대상이 아니므로 구독하지 않는다.
  viewerId: string | null;
}

export function useLiveBanEviction({ supabase, queryClient, creatorId, viewerId }: Params) {
  useEffect(() => {
    if (!viewerId || !creatorId) return;

    const watchKey = QUERY_KEYS.live.watch(creatorId, viewerId);

    const channel = supabase
      .channel(`live-ban-${creatorId}-${viewerId}`)
      // 새 활성 밴(INSERT) → watch 캐시를 즉시 isBanned=true 로 바꿔 차단 화면으로 전환한다(네트워크 왕복 없음).
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "channel_viewer_ban",
          filter: `banned_user_id=eq.${viewerId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown> | null;
          if (!row || row.creator_id !== creatorId || row.unbanned_at) return;

          queryClient.setQueryData<LiveWatchData | null>(watchKey, (prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              viewerRelation: prev.viewerRelation
                ? { ...prev.viewerRelation, isBanned: true }
                : prev.viewerRelation,
              viewerChatState: {
                ...prev.viewerChatState,
                canChat: false,
                chatUnavailableReason: "banned",
                remainingFollowWaitSeconds: 0,
                remainingSlowModeSeconds: 0,
              },
            };
          });
        },
      )
      // 해제(UPDATE: unbanned_at 채워짐) → watch 를 다시 받아 차단 화면을 자동 해제한다(재강퇴는 새 INSERT 로 처리).
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "channel_viewer_ban",
          filter: `banned_user_id=eq.${viewerId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown> | null;
          if (!row || row.creator_id !== creatorId || !row.unbanned_at) return;

          void queryClient.invalidateQueries({ queryKey: watchKey });
        },
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [supabase, queryClient, creatorId, viewerId]);
}
