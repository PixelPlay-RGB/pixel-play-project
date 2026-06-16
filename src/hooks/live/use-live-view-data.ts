"use client";
// 라이브 시청 화면의 방송·크리에이터·채팅 상태 데이터를 조회합니다.

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getLiveSubscriptionBadgeAssetsAction,
  getLiveSubscriptionEmotesAction,
} from "@/actions/live/live";
import { createClient } from "@/lib/supabase/client";
import {
  clearLiveSubscriptionBadgeSourceCache,
  getLiveSubscriptionBadgeSourcesByMonth,
  preloadLiveSubscriptionBadgeSources,
} from "@/utils/live/live-subscription-badge";
import { useAuthStore } from "@/stores/auth";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { toastAppInfo } from "@/utils/common/toast-message";
import { normalizeLiveViewData } from "@/utils/live/live-view-data";
import { isUuid } from "@/utils/common/uuid";
import type { LiveWatchData } from "@/types/live/live";

export function useLiveViewData(creatorId: string) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAuthLoading = useAuthStore((s) => s.loading);
  const isValidCreatorId = isUuid(creatorId);
  // 시청 중 종료 시 멈춘 경과 시간(초). 종료 이벤트의 ended_at − started_at로 정확히 계산해 둔다.
  // broadcast가 다시 잡히면(라이브) 정보 행이 broadcast.elapsedSeconds를 쓰므로 이 값은 무시된다.
  const [endedElapsedSeconds, setEndedElapsedSeconds] = useState<number | null>(null);

  const query = useQuery<LiveWatchData | null>({
    queryKey: QUERY_KEYS.live.watch(creatorId, user?.id),
    enabled: !isAuthLoading && isValidCreatorId,
    staleTime: 1000 * 30,
    queryFn: async () => {
      const [watchResult, countResult, badgeAssetsResult, emotesResult] = await Promise.all([
        supabase.rpc("get_live_watch", {
          p_creator_id: creatorId,
          ...(user?.id ? { p_viewer_id: user.id } : {}),
        }),
        supabase.rpc("get_live_watch_count", {
          p_creator_id: creatorId,
        }),
        getLiveSubscriptionBadgeAssetsAction(creatorId),
        getLiveSubscriptionEmotesAction(creatorId),
      ]);

      if (watchResult.error) {
        console.error("get_live_watch 실패", watchResult.error);
        return null;
      }

      if (countResult.error) {
        console.error("get_live_watch_count 실패", countResult.error);
      }

      const watchData = normalizeLiveViewData(watchResult.data, countResult.data);
      if (!watchData) return null;

      const badgeAssets = badgeAssetsResult.success ? badgeAssetsResult.data : null;
      const subscriptionEmotes = emotesResult.success ? (emotesResult.data ?? []) : [];

      return {
        ...watchData,
        subscriptionBadgeCustomMonths: badgeAssets?.customMonths ?? [],
        subscriptionBadgeVersion: badgeAssets?.version ?? null,
        subscriptionBadgeImageSources: getLiveSubscriptionBadgeSourcesByMonth(creatorId, {
          customMonths: badgeAssets?.customMonths ?? [],
          availableMonths: badgeAssets?.availableMonths ?? [],
          version: badgeAssets?.version ?? null,
        }),
        subscriptionEmotes,
      };
    },
  });

  useEffect(() => {
    const data = query.data;
    if (!data?.subscriptionBadgeImageSources) return;

    preloadLiveSubscriptionBadgeSources(Object.values(data.subscriptionBadgeImageSources));
  }, [query.data]);

  useEffect(() => {
    return () => {
      const watchQueryKey = QUERY_KEYS.live.watch(creatorId, user?.id);
      queryClient.removeQueries({ queryKey: watchQueryKey, exact: true });
      clearLiveSubscriptionBadgeSourceCache();
    };
  }, [creatorId, queryClient, user?.id]);

  const broadcastId = query.data?.broadcast?.id;

  useEffect(() => {
    if (!broadcastId) return;

    const watchKey = QUERY_KEYS.live.watch(creatorId, user?.id);

    // 방송 종료 처리: broadcast만 null로 비우고 creator는 남겨 종료 화면에서 채널 정보를 보여준다.
    // 멈춘 경과 시간은 ended_at(payload) − started_at(캐시)로 정확히 계산해 둔다(감지 지연 영향 없음).
    // 실제로 라이브였다가 종료된 전환일 때만 toast를 띄우고, 중복 이벤트에도 한 번만 뜨도록 플래그로 가드.
    function handleBroadcastEnded(endedAtIso?: string) {
      let didEnd = false;
      let frozenSeconds: number | null = null;
      queryClient.setQueryData<LiveWatchData | null>(watchKey, (prev) => {
        if (!prev?.broadcast) return prev;
        didEnd = true;
        const startedMs = new Date(prev.broadcast.startedAt).getTime();
        const endedMs = endedAtIso ? new Date(endedAtIso).getTime() : Date.now();
        frozenSeconds = Math.max(0, Math.floor((endedMs - startedMs) / 1000));
        return { ...prev, broadcast: null };
      });
      if (didEnd) {
        setEndedElapsedSeconds(frozenSeconds);
        toastAppInfo(APP_MESSAGE_CODE.info.live.broadcastEnded);
      }
    }

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
          const next = payload.new as Record<string, unknown>;

          // 시청자 수 갱신만 postgres_changes로 받는다.
          // 종료(ended_at)는 RLS SELECT 정책상(ended_at is null) 종료된 행이 일반 시청자에게
          // 안 보여 이 UPDATE 이벤트가 전달되지 않으므로, 아래 broadcast 이벤트로 별도 처리한다.
          const newViewerCount = next.current_viewer_count;
          if (typeof newViewerCount !== "number") return;

          queryClient.setQueryData<LiveWatchData | null>(watchKey, (prev) => {
            if (!prev?.broadcast) return prev;
            return {
              ...prev,
              broadcast: { ...prev.broadcast, currentViewerCount: newViewerCount },
            };
          });
        },
      )
      // 방송 종료는 DB 트리거(broadcast_live_broadcast_ended)가 realtime.send로 쏘는
      // public broadcast 이벤트로 받는다 — RLS와 무관하게 모든 시청자에게 즉시 전달된다.
      .on("broadcast", { event: "broadcast_ended" }, (message) => {
        const endedAt = (message?.payload as { ended_at?: string } | undefined)?.ended_at;
        handleBroadcastEnded(endedAt);
      })
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [broadcastId, creatorId, user?.id, supabase, queryClient]);

  // 종료/오프라인 상태에서 같은 크리에이터가 새 방송을 시작하면(INSERT) 다시 불러와 video로 되돌린다.
  // 새 방송 행은 ended_at=null이라 RLS SELECT를 통과해 시청자에게도 INSERT 이벤트가 전달된다.
  // (종료 UPDATE와 달리 트리거가 필요 없다.) creator 범위로 구독해 방송 유무와 무관하게 항상 듣는다.
  useEffect(() => {
    if (!isValidCreatorId) return;

    const channel = supabase
      .channel(`live-creator-${creatorId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_broadcast",
          filter: `creator_id=eq.${creatorId}`,
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.live.watch(creatorId, user?.id),
          });
        },
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [creatorId, isValidCreatorId, user?.id, supabase, queryClient]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    endedElapsedSeconds,
  };
}
