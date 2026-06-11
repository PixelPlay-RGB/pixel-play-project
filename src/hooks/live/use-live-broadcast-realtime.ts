"use client";
// 라이브 방송 한 건의 realtime 채널(live-broadcast-{id})을 구독해
// 시청자 수 갱신과 방송 종료 신호를 콜백으로 전달합니다.
// 시청 화면(use-live-view-data)과 미니플레이어가 공유한다 — 둘은 상호 배타로 렌더되어 중복 구독이 없다.

import { useEffect, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface UseLiveBroadcastRealtimeOptions {
  // current_viewer_count가 바뀔 때마다 최신값을 받는다(시청자 수를 안 쓰는 표면은 생략).
  onViewerCountChange?: (count: number) => void;
  // 방송 종료 신호. payload의 ended_at(ISO)을 그대로 전달한다.
  onEnded: (endedAtIso?: string) => void;
}

export function useLiveBroadcastRealtime(
  broadcastId: string | null | undefined,
  { onViewerCountChange, onEnded }: UseLiveBroadcastRealtimeOptions,
) {
  const supabase = useMemo(() => createClient(), []);

  // 콜백이 매 렌더 새 함수여도 재구독하지 않도록 최신 참조만 유지한다.
  const onViewerCountChangeRef = useRef(onViewerCountChange);
  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onViewerCountChangeRef.current = onViewerCountChange;
    onEndedRef.current = onEnded;
  });

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
          const next = payload.new as Record<string, unknown>;

          // 시청자 수 갱신만 postgres_changes로 받는다.
          // 종료(ended_at)는 RLS SELECT 정책상(ended_at is null) 종료된 행이 일반 시청자에게
          // 안 보여 이 UPDATE 이벤트가 전달되지 않으므로, 아래 broadcast 이벤트로 별도 처리한다.
          const newViewerCount = next.current_viewer_count;
          if (typeof newViewerCount !== "number") return;
          onViewerCountChangeRef.current?.(newViewerCount);
        },
      )
      // 방송 종료는 DB 트리거(broadcast_live_broadcast_ended)가 realtime.send로 쏘는
      // public broadcast 이벤트로 받는다 — RLS와 무관하게 모든 시청자에게 즉시 전달된다.
      .on("broadcast", { event: "broadcast_ended" }, (message) => {
        const endedAt = (message?.payload as { ended_at?: string } | undefined)?.ended_at;
        onEndedRef.current(endedAt);
      })
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [broadcastId, supabase]);
}
