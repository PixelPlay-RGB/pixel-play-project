"use client";
// 라이브 방송의 투표 목록을 실시간으로 조회하는 훅입니다.

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import type { LivePoll, LivePollOption } from "@/types/live/live";

function parsePollOption(item: unknown): LivePollOption | null {
  if (!item || typeof item !== "object" || Array.isArray(item)) return null;
  const obj = item as Record<string, unknown>;
  const id = typeof obj.id === "string" ? obj.id : null;
  const label = typeof obj.label === "string" ? obj.label : null;
  if (!id || !label) return null;
  return { id, label, count: typeof obj.count === "number" ? obj.count : 0 };
}

function parsePollOptions(raw: unknown): LivePollOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const opt = parsePollOption(item);
    return opt ? [opt] : [];
  });
}

export function useLivePolls(broadcastId: string | null | undefined) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const query = useQuery<LivePoll[]>({
    queryKey: QUERY_KEYS.live.polls(broadcastId ?? undefined),
    enabled: !!broadcastId,
    staleTime: Infinity,
    queryFn: async () => {
      if (!broadcastId) throw new Error("broadcastId is required");
      const { data, error } = await supabase
        .from("live_poll")
        .select("id, title, options, ended_at")
        .eq("broadcast_id", broadcastId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data ?? []).map((row) => {
        const options = parsePollOptions(row.options);
        return {
          id: row.id,
          title: row.title,
          options,
          status: row.ended_at ? ("ended" as const) : ("active" as const),
          totalCount: options.reduce((sum, o) => sum + o.count, 0),
        };
      });
    },
  });

  // Realtime — 투표 생성·종료 실시간 반영
  useEffect(() => {
    if (!broadcastId) return;

    const channel = supabase
      .channel(`live-polls-${broadcastId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_poll",
          filter: `broadcast_id=eq.${broadcastId}`,
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.live.polls(broadcastId),
          });
        },
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [broadcastId, supabase, queryClient]);

  return {
    polls: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
