"use client";
// 채널(creator) 단위 라이브 채팅 조회·실시간 수신·과거 적재(무한 스크롤)를 담당합니다.
// 방송 중 메시지와 방송 외 채널 메시지가 한 타임라인이라 broadcast가 아닌 creator로 묶는다(#111).

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import {
  LIVE_MESSAGE_HISTORY_CAP,
  LIVE_MESSAGE_INITIAL_LIMIT,
  LIVE_MESSAGE_PAGE_SIZE,
} from "@/constants/live/live";
import {
  mapLiveMessageRealtimePayload,
  mapLiveMessageRowToMessage,
  type LiveMessageRow,
} from "@/utils/live/live-message";
import { appendLiveMessage } from "@/utils/live/live-chat";
import type { LiveChatMessage } from "@/types/live/live";

// 닉네임·후원 금액은 metadata에 스냅샷으로 들어 있어 join이 필요 없다(Realtime payload와 동일 경로).
// user·donation join을 빼야 anon RLS("Anyone can read live messages")만으로 비로그인도 조회된다.
const LIVE_MESSAGE_SELECT =
  "id, created_at, sender_id, message_type, content, is_chat_visible, sender_role, metadata" as const;
const EMPTY_LIVE_MESSAGES: LiveChatMessage[] = [];

export function useLiveMessages(creatorId: string | null | undefined, viewerId?: string) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const enabled = !!creatorId;
  // 과거 적재(무한 스크롤) 상태. 누적이 HISTORY_CAP에 닿거나 더 줄 게 없으면 멈춘다(치지직식).
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  // 진입 시점의 마지막 메시지 id — 필터링 안내를 이 메시지 바로 뒤(바닥)에 끼워 넣는 기준.
  // undefined = 초기 로드 전, null = 진입 시점에 메시지가 없었음(안내가 첫 행).
  const [entryNoticeAnchorId, setEntryNoticeAnchorId] = useState<string | null | undefined>(
    undefined,
  );

  const query = useQuery<LiveChatMessage[]>({
    queryKey: QUERY_KEYS.live.messages(creatorId ?? undefined),
    enabled,
    staleTime: Infinity,
    queryFn: async () => {
      if (!creatorId) throw new Error("creatorId is required");
      const { data, error } = await supabase
        .from("live_message")
        .select(LIVE_MESSAGE_SELECT)
        .eq("creator_id", creatorId)
        .eq("is_chat_visible", true)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(LIVE_MESSAGE_INITIAL_LIMIT)
        .returns<LiveMessageRow[]>();

      if (error) throw error;

      return (data ?? []).reverse().flatMap((row) => {
        const message = mapLiveMessageRowToMessage(row, creatorId ?? undefined, viewerId);

        return message ? [message] : [];
      });
    },
  });

  // 진입(첫 로드 완료) 시점의 마지막 메시지를 1회 고정한다 — 그 뒤 도착하는 메시지는
  // 안내 아래(최신 쪽)에 쌓여, 안내가 "진입 시점 바닥"에서 자연스럽게 위로 밀려 올라간다.
  // (렌더 중 가드된 setState — use-live-broadcast-view의 lastBroadcast와 같은 조정 패턴)
  if (entryNoticeAnchorId === undefined && !query.isLoading && query.data) {
    setEntryNoticeAnchorId(query.data.at(-1)?.id ?? null);
  }

  // 위로 스크롤 시 과거 메시지를 (created_at, id) 커서로 한 페이지씩 앞에 붙인다.
  // 같은 created_at 동시 전송이 있어도 id 2차 정렬로 누락·중복 없이 이어진다.
  const loadOlderMessages = useCallback(async () => {
    if (!creatorId || isLoadingOlder || !hasMoreHistory) return;

    const current =
      queryClient.getQueryData<LiveChatMessage[]>(QUERY_KEYS.live.messages(creatorId)) ?? [];

    if (current.length >= LIVE_MESSAGE_HISTORY_CAP) {
      setHasMoreHistory(false);
      return;
    }

    // 낙관적/로컬 안내 메시지는 createdAt이 없다 — 서버 메시지 중 가장 오래된 것을 커서로 쓴다.
    const cursor = current.find((message) => message.createdAt);
    if (!cursor?.createdAt) return;

    setIsLoadingOlder(true);
    try {
      const { data, error } = await supabase
        .from("live_message")
        .select(LIVE_MESSAGE_SELECT)
        .eq("creator_id", creatorId)
        .eq("is_chat_visible", true)
        .or(
          `created_at.lt."${cursor.createdAt}",and(created_at.eq."${cursor.createdAt}",id.lt."${cursor.id}")`,
        )
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(LIVE_MESSAGE_PAGE_SIZE)
        .returns<LiveMessageRow[]>();

      if (error) throw error;

      const olderMessages = (data ?? []).reverse().flatMap((row) => {
        const message = mapLiveMessageRowToMessage(row, creatorId, viewerId);
        return message ? [message] : [];
      });

      if ((data ?? []).length < LIVE_MESSAGE_PAGE_SIZE) {
        setHasMoreHistory(false);
      }

      if (olderMessages.length > 0) {
        queryClient.setQueryData<LiveChatMessage[]>(QUERY_KEYS.live.messages(creatorId), (prev) => {
          const list = prev ?? [];
          const existingIds = new Set(list.map((message) => message.id));
          const fresh = olderMessages.filter((message) => !existingIds.has(message.id));
          const next = [...fresh, ...list];
          if (next.length >= LIVE_MESSAGE_HISTORY_CAP) {
            setHasMoreHistory(false);
          }
          return next;
        });
      }
    } catch (error) {
      console.error("이전 채팅 불러오기 실패", error);
    } finally {
      setIsLoadingOlder(false);
    }
  }, [creatorId, viewerId, isLoadingOlder, hasMoreHistory, supabase, queryClient]);

  // Realtime — 새 메시지 실시간 수신
  useEffect(() => {
    if (!creatorId) return;

    const channel = supabase
      .channel(`live-messages-${creatorId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_message",
          filter: `creator_id=eq.${creatorId}`,
        },
        (payload) => {
          // 후원 메시지면 후원 랭킹도 갱신한다. live_message INSERT 구독을 메시지 훅 한 곳으로
          // 모아, 후원 랭킹 훅이 같은 테이블에 별도 채널을 또 열지 않게 한다.
          const row =
            payload.new && typeof payload.new === "object"
              ? (payload.new as Record<string, unknown>)
              : null;
          if (row?.message_type === "donation") {
            void queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.donations.liveRanking(creatorId),
            });
          }

          // 채팅에 표시하지 않는 메시지(투표·추첨 공지 등)는 목록에 넣지 않는다.
          if (row?.is_chat_visible === false) return;

          // Realtime payload의 metadata로 바로 매핑한다(추가 단건 조회 없음).
          const nextMessage = mapLiveMessageRealtimePayload(payload.new, creatorId, viewerId);
          if (!nextMessage) return;

          queryClient.setQueryData<LiveChatMessage[]>(
            QUERY_KEYS.live.messages(creatorId),
            (prev) => {
              if (!prev) return [nextMessage];
              // 본인 메시지는 낙관적 항목이 실제 id로 먼저 승격되어 있다 — 스킵하면 서버
              // 스냅샷(sender_role 등)이 반영되지 않으므로 같은 id는 서버 버전으로 교체한다.
              if (prev.some((m) => m.id === nextMessage.id)) {
                return prev.map((m) => (m.id === nextMessage.id ? nextMessage : m));
              }
              return appendLiveMessage(prev, nextMessage);
            },
          );
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // 재구독 사이의 갭에서 놓친 변경을 복구한다. live_message 구독을 이 훅으로 일원화했으므로
          // (use-live-donation-ranking 참고) 메시지뿐 아니라 후원 랭킹도 함께 복구해야 한다 —
          // viewerId(로그인) 변경으로 재구독되는 틈에 후원 INSERT가 도착하면 랭킹이 stale로 남는다.
          void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.live.messages(creatorId) });
          void queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.donations.liveRanking(creatorId),
          });
        }
      });

    return () => {
      void channel.unsubscribe();
    };
  }, [creatorId, viewerId, supabase, queryClient]);

  return {
    messages: query.data ?? EMPTY_LIVE_MESSAGES,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    loadOlderMessages,
    isLoadingOlder,
    hasMoreHistory,
    entryNoticeAnchorId,
  };
}
