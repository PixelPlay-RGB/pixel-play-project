"use client";
// 라이브 시청 화면의 방송·크리에이터·채팅 상태 데이터를 조회합니다.

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useLiveBroadcastRealtime } from "@/hooks/live/use-live-broadcast-realtime";
import { useAuthStore } from "@/stores/auth";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { toastAppInfo } from "@/utils/common/toast-message";
import { normalizeLiveViewData } from "@/utils/live/live-view-data";
import { isUuid } from "@/utils/common/uuid";
import { useLiveBanEviction } from "@/hooks/live/use-live-ban-eviction";
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
        // null 반환(=오프라인 확정과 동일) 대신 throw해 TanStack retry를 태우고,
        // background refetch 실패 시 직전 캐시(라이브 상태)를 보존한다 — 일시 오류가
        // 시청 화면 오프라인 전환·시청 세션 종료로 오판되는 것을 막는다.
        throw watchResult.error;
      }

      if (countResult.error) {
        console.error("get_live_watch_count 실패", countResult.error);
      }

      return normalizeLiveViewData(watchResult.data, countResult.data);
    },
  });

  const broadcastId = query.data?.broadcast?.id;
  const watchKey = QUERY_KEYS.live.watch(creatorId, user?.id);

  // 강퇴/해제 realtime 단독 소유 — 당사자에게만 전달되며, watch 캐시를 통해 메인+팝아웃이 함께 반응한다(#119).
  useLiveBanEviction({
    supabase,
    queryClient,
    creatorId,
    viewerId: user?.id ?? null,
  });

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

  // 시청자 수·종료 신호 구독은 미니플레이어와 공유하는 훅으로 분리했다(채널·이벤트 정책은 훅 주석 참고).
  useLiveBroadcastRealtime(broadcastId, {
    onViewerCountChange: (count) => {
      queryClient.setQueryData<LiveWatchData | null>(watchKey, (prev) => {
        if (!prev?.broadcast) return prev;
        return {
          ...prev,
          broadcast: { ...prev.broadcast, currentViewerCount: count },
        };
      });
    },
    onEnded: handleBroadcastEnded,
  });

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
