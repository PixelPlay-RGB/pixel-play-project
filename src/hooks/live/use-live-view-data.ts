"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { normalizeLiveViewData } from "@/utils/live/live-view-data";
import type { LiveWatchData } from "@/types/live/live";

export function useLiveViewData(creatorId: string) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAuthLoading = useAuthStore((s) => s.loading);

  const query = useQuery<LiveWatchData | null>({
    queryKey: QUERY_KEYS.live.watch(creatorId, user?.id),
    enabled: !isAuthLoading,
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

      if (countResult.error) {
        console.error("get_live_watch_count 실패", countResult.error);
      }

      return normalizeLiveViewData(watchResult.data, countResult.data);
    },
  });

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
