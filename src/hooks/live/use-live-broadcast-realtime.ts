"use client";
// 라이브 방송 한 건의 realtime 채널(live-broadcast-{id})을 구독해
// 시청자 수 갱신과 방송 종료 신호를 콜백으로 전달합니다.
// 시청 화면(use-live-view-data)과 미니플레이어가 공유한다 — 보통은 상호 배타로 렌더되어 중복이 없고,
// 둘이 함께 뜨는 PIP에선 미니가 broadcastId=null로 구독을 양보해 같은 채널 이중 구독(Realtime 에러)을 피한다.

import { useEffect, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface UseLiveBroadcastRealtimeOptions {
  // current_viewer_count가 바뀔 때마다 최신값을 받는다(시청자 수를 안 쓰는 표면은 생략).
  onViewerCountChange?: (count: number) => void;
  // 방송 종료 신호. payload의 ended_at(ISO)을 그대로 전달한다. 구독 1회당 최대 1번만 호출된다
  // (broadcast 이벤트와 liveness 보정이 겹쳐도 소비자가 중복 가드를 들 필요 없음).
  onEnded: (endedAtIso?: string) => void;
  // 첫 조인에서도 liveness를 보정할지. 시청 화면은 직전 watch RPC가 막 생존을 확인했으므로
  // 생략(기본값)하고, 미니플레이어는 핸드오프 갭(이전 표면 구독 해제~새 구독 사이에 종료되면
  // 단발 이벤트를 영영 못 받음)을 메워야 하므로 켠다.
  verifyOnFirstJoin?: boolean;
}

export function useLiveBroadcastRealtime(
  broadcastId: string | null | undefined,
  { onViewerCountChange, onEnded, verifyOnFirstJoin = false }: UseLiveBroadcastRealtimeOptions,
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

    // cancelled: 언마운트·broadcastId 교체 후 늦게 resolve된 liveness 조회가 새 컨텍스트를
    // 잘못 종료 처리하지 않게 막는다. endedFired: 종료 신호 1회 보장(이벤트+보정 중복 방어).
    let cancelled = false;
    let hasJoined = false;
    let endedFired = false;
    const fireEnded = (endedAtIso?: string) => {
      if (cancelled || endedFired) return;
      endedFired = true;
      onEndedRef.current(endedAtIso);
    };

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
        fireEnded(endedAt);
      })
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") return;
        // broadcast_ended는 단발 이벤트라, 구독 공백(절전/네트워크 단절 후 재조인, 또는
        // verifyOnFirstJoin이 켜진 표면의 핸드오프 갭) 동안 종료되면 다시 오지 않는다 —
        // 조인 시 liveness를 보정한다. RLS상 종료 행은 시청자에게 안 보이고 크리에이터
        // 본인에게만 보이므로 "행 없음 또는 ended_at 설정"을 종료로 간주한다.
        // 조회 오류는 오탐 종료 방지를 위해 무시.
        const isFirstJoin = !hasJoined;
        hasJoined = true;
        if (isFirstJoin && !verifyOnFirstJoin) return;
        void supabase
          .from("live_broadcast")
          .select("ended_at")
          .eq("id", broadcastId)
          .maybeSingle()
          .then(({ data, error }) => {
            if (cancelled || error) return;
            if (!data || data.ended_at !== null) {
              fireEnded(data?.ended_at ?? undefined);
            }
          });
      });

    return () => {
      cancelled = true;
      void channel.unsubscribe();
    };
  }, [broadcastId, supabase, verifyOnFirstJoin]);
}
