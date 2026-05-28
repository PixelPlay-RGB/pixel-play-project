"use client";
// get_live_watch + get_live_watch_count RPC 병렬 조회 + live_broadcast Realtime 시청자 수 갱신 훅입니다.

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import type { LiveWatchData } from "@/types/live/live";

const IS_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface LiveWatchCountResult {
  followerCount: number;
  broadcastCount: number;
}

export function useLiveWatch(creatorId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAuthLoading = useAuthStore((s) => s.loading);

  const query = useQuery<LiveWatchData | null>({
    queryKey: QUERY_KEYS.live.watch(creatorId, user?.id),
    // TODO [mock] real 모드 전환 시 IS_UUID_REGEX 조건 제거
    enabled: !isAuthLoading && IS_UUID_REGEX.test(creatorId),
    staleTime: 1000 * 30,
    queryFn: async () => {
      const [watchResult, countResult] = await Promise.all([
        supabase.rpc("get_live_watch", {
          p_creator_id: creatorId,
          ...(user?.id ? { p_viewer_id: user.id } : {}),
        }),
        supabase.rpc("get_live_watch_count", {
          p_creator_id: creatorId,
        }),
      ]);

      if (watchResult.error) {
        console.error("get_live_watch 실패", watchResult.error);
        return null;
      }

      const raw = watchResult.data;
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

      // RPC 응답의 JSON 키를 앱 타입으로 매핑
      // - creator: followerCount/broadcastCount는 get_live_watch_count에서 병합
      // - viewerChatState: blockedReason(JSON 키) → chatUnavailableReason(앱 타입)
      type RawWatchData = Omit<LiveWatchData, "creator" | "viewerChatState"> & {
        creator: Omit<LiveWatchData["creator"], "followerCount" | "broadcastCount">;
        viewerChatState: Omit<LiveWatchData["viewerChatState"], "chatUnavailableReason"> & {
          blockedReason: LiveWatchData["viewerChatState"]["chatUnavailableReason"];
        };
      };

      const watchData = raw as unknown as RawWatchData;

      const count =
        countResult.data && typeof countResult.data === "object" && !Array.isArray(countResult.data)
          ? (countResult.data as unknown as LiveWatchCountResult)
          : { followerCount: 0, broadcastCount: 0 };

      const { blockedReason, ...restChatState } = watchData.viewerChatState;

      return {
        ...watchData,
        creator: {
          ...watchData.creator,
          followerCount: count.followerCount,
          broadcastCount: count.broadcastCount,
        },
        viewerChatState: {
          ...restChatState,
          chatUnavailableReason: blockedReason,
        },
      } as LiveWatchData;
    },
  });

  // live_broadcast Realtime — 시청자 수 실시간 갱신
  const broadcastId = query.data?.broadcast?.id;

  useEffect(() => {
    if (!broadcastId) return;

    const channel = supabase
      .channel(`live-broadcast-${broadcastId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_broadcast",
          filter: `id=eq.${broadcastId}`,
        },
        (payload) => {
          if (!payload.new || typeof payload.new !== "object") return;
          const newViewerCount = (payload.new as Record<string, unknown>).current_viewer_count;
          if (typeof newViewerCount !== "number") return;

          queryClient.setQueryData<LiveWatchData | null>(
            QUERY_KEYS.live.watch(creatorId, user?.id),
            (prev) => {
              if (!prev?.broadcast) return prev;
              return {
                ...prev,
                broadcast: { ...prev.broadcast, currentViewerCount: newViewerCount },
              };
            },
          );
        },
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [broadcastId, creatorId, user?.id, supabase, queryClient]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
