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

export function useLivePolls(broadcastId: string | null | undefined, userId?: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const query = useQuery<LivePoll[]>({
    queryKey: QUERY_KEYS.live.pollsForViewer(broadcastId ?? undefined, userId),
    enabled: !!broadcastId,
    staleTime: Infinity,
    queryFn: async () => {
      if (!broadcastId) throw new Error("broadcastId is required");

      const { data: pollRows, error } = await supabase
        .from("live_poll")
        .select("id, title, options, created_at, ends_at, ended_at")
        .eq("broadcast_id", broadcastId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const polls = pollRows ?? [];
      if (polls.length === 0) return [];

      const pollIds = polls.map((p) => p.id);

      const userVoteMap = new Map<string, string>();
      if (userId) {
        const { data: voteRows, error: voteError } = await supabase
          .from("live_poll_vote")
          .select("poll_id, option_id")
          .in("poll_id", pollIds)
          .eq("voter_id", userId);

        if (voteError) {
          console.error("투표 참여 여부 조회 실패", voteError);
          throw voteError;
        }

        for (const row of voteRows ?? []) {
          userVoteMap.set(row.poll_id, row.option_id);
        }
      }

      return polls.map((row) => {
        const options = parsePollOptions(row.options);
        const hasEndedByTime =
          row.ends_at !== null && new Date(row.ends_at).getTime() <= Date.now();
        return {
          createdAt: row.created_at,
          id: row.id,
          title: row.title,
          options,
          status: row.ended_at || hasEndedByTime ? ("ended" as const) : ("active" as const),
          endsAt: row.ends_at,
          endedAt: row.ended_at,
          totalCount: options.reduce((sum, o) => sum + o.count, 0),
          userVotedOptionId: userVoteMap.get(row.id) ?? null,
        };
      });
    },
  });

  // Realtime — 투표 생성·종료 실시간 반영
  useEffect(() => {
    if (!broadcastId) return;

    // 득표수 변화는 트리거가 live_poll.options를 UPDATE하므로 live_poll 구독만으로 충분하다.
    // (과거 live_poll_vote 전역 구독은 중복 + 필터 불가한 전역 fan-out이라 제거했다.)
    const invalidatePolls = () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.live.polls(broadcastId),
      });
    };

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
        invalidatePolls,
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [broadcastId, supabase, queryClient]);

  useEffect(() => {
    if (!broadcastId || !query.data) return;

    const nextEndsAt = query.data
      .filter((poll) => poll.status === "active" && poll.endsAt)
      .map((poll) => new Date(poll.endsAt as string).getTime())
      .filter((time) => Number.isFinite(time) && time > Date.now())
      .sort((a, b) => a - b)[0];

    if (!nextEndsAt) return;

    const timeoutId = window.setTimeout(
      () => {
        void queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.live.polls(broadcastId),
        });
      },
      // 32비트 setTimeout 한계(약 24.8일)를 넘기면 즉시 발화 → invalidate 루프가 되므로 상한을 둔다.
      Math.min(Math.max(nextEndsAt - Date.now() + 500, 0), 2_147_483_647),
    );

    return () => window.clearTimeout(timeoutId);
  }, [broadcastId, query.data, queryClient]);

  return {
    polls: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
