"use client";
// 라이브 상호작용 결과 공지를 기존 live_message metadata에서 조회합니다.

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { readJsonObject, readNumber, readString } from "@/utils/common/json";
import {
  mergeDrawParticipationIntoNotices,
  type LiveDrawParticipationRow,
} from "@/utils/live/live-draw-participation";
import type { Json } from "@/types/database.types";
import {
  getLiveRouletteResultDelayMs,
  LIVE_ROULETTE_SSE_EVENT,
  type LiveRouletteSsePayload,
} from "@/utils/live/live-roulette-sse";
import type {
  LiveInteractionNotice,
  LiveInteractionNoticeStatus,
  LiveInteractionNoticeType,
} from "@/types/live/live";

interface LiveInteractionNoticeRow {
  content: string;
  created_at: string;
  id: string;
  metadata: Json;
}

interface RealtimeRouletteNoticeState {
  broadcastId: string;
  notice: LiveInteractionNotice;
  receivedAtMs: number;
}

const LIVE_INTERACTION_NOTICE_LIMIT = 20;
const LIVE_DRAW_PARTICIPATION_SOURCE = "live_draw_participation";
const LIVE_DRAW_PARTICIPATION_PAGE_SIZE = 1000;

function readNoticeType(value: Json | undefined): LiveInteractionNoticeType | null {
  const type = readString(value);

  if (type === "draw" || type === "roulette") {
    return type;
  }

  return null;
}

function readNoticeStatus(value: Json | undefined): LiveInteractionNoticeStatus {
  const status = readString(value);

  return status === "active" ? "active" : "ended";
}

function readStringArray(value: Json | undefined): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const items = value.filter((item): item is string => typeof item === "string" && !!item.trim());

  return items.length > 0 ? items : undefined;
}

function readRouletteBroadcastNotice(value: unknown): LiveInteractionNotice | null {
  if (!value || typeof value !== "object") return null;

  const payload = value as Partial<LiveRouletteSsePayload>;
  const id = typeof payload.id === "string" ? payload.id : "";
  const createdAt = typeof payload.createdAt === "string" ? payload.createdAt : "";
  const resultLabel = typeof payload.resultLabel === "string" ? payload.resultLabel : "";
  const status =
    payload.status === "active" ? "active" : payload.status === "ended" ? "ended" : null;
  const items = Array.isArray(payload.items)
    ? payload.items.filter((item): item is string => typeof item === "string" && !!item.trim())
    : [];
  const rotationKeyframes = Array.isArray(payload.rotationKeyframes)
    ? payload.rotationKeyframes.filter((item): item is number => Number.isFinite(item))
    : [];
  const durationSeconds =
    typeof payload.durationSeconds === "number" && Number.isFinite(payload.durationSeconds)
      ? payload.durationSeconds
      : undefined;

  if (!id || !createdAt || !resultLabel || !status || items.length < 2) {
    return null;
  }

  return {
    content: resultLabel,
    createdAt,
    id,
    resultLabel,
    rouletteDurationSeconds: durationSeconds,
    rouletteItems: items,
    rouletteRotationKeyframes: rotationKeyframes,
    status,
    type: "roulette",
  };
}

function mapNoticeRow(row: LiveInteractionNoticeRow): LiveInteractionNotice | null {
  const metadata = readJsonObject(row.metadata);

  if (readString(metadata.source) !== "live_interaction") {
    return null;
  }

  const type = readNoticeType(metadata.interactionType);

  if (!type) {
    return null;
  }

  return {
    content: row.content,
    createdAt: row.created_at,
    drawNoticeId: readString(metadata.drawNoticeId) ?? undefined,
    id: row.id,
    participantCount: readNumber(metadata.participantCount) ?? undefined,
    resultLabel: readString(metadata.resultLabel) ?? undefined,
    status: readNoticeStatus(metadata.status),
    type,
    winnerNames: readStringArray(metadata.winnerNames),
  };
}

export function useLiveInteractionNotices(
  broadcastId: string | null | undefined,
  viewerId?: string | null,
) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const [realtimeRouletteNotice, setRealtimeRouletteNotice] =
    useState<RealtimeRouletteNoticeState | null>(null);
  const realtimeRouletteNoticeRef = useRef<RealtimeRouletteNoticeState | null>(null);
  const rouletteResultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = useQuery<LiveInteractionNotice[]>({
    queryKey: QUERY_KEYS.live.interactionNotices(broadcastId ?? undefined, viewerId),
    enabled: !!broadcastId,
    staleTime: Infinity,
    queryFn: async () => {
      if (!broadcastId) throw new Error("broadcastId is required");

      const { data, error } = await supabase
        .from("live_message")
        .select("id, created_at, content, metadata")
        .eq("broadcast_id", broadcastId)
        .eq("message_type", "moderation_notice")
        .contains("metadata", { source: "live_interaction" })
        .order("created_at", { ascending: false })
        .limit(LIVE_INTERACTION_NOTICE_LIMIT)
        .returns<LiveInteractionNoticeRow[]>();

      if (error) throw error;

      const notices = (data ?? []).flatMap((row) => {
        const notice = mapNoticeRow(row);
        return notice ? [notice] : [];
      });
      const hasDrawNotice = notices.some((notice) => notice.type === "draw");

      if (!hasDrawNotice) {
        return notices;
      }

      const participationRows: LiveDrawParticipationRow[] = [];
      let offset = 0;

      while (true) {
        const { data: participationPage, error: participationError } = await supabase
          .from("live_message")
          .select("created_at, metadata, sender_id, sender:sender_id(nickname)")
          .eq("broadcast_id", broadcastId)
          .eq("message_type", "moderation_notice")
          .contains("metadata", { source: LIVE_DRAW_PARTICIPATION_SOURCE })
          .not("sender_id", "is", null)
          .order("created_at", { ascending: true })
          .range(offset, offset + LIVE_DRAW_PARTICIPATION_PAGE_SIZE - 1)
          .returns<LiveDrawParticipationRow[]>();

        if (participationError) throw participationError;

        participationRows.push(...(participationPage ?? []));

        if (!participationPage || participationPage.length < LIVE_DRAW_PARTICIPATION_PAGE_SIZE) {
          break;
        }

        offset += LIVE_DRAW_PARTICIPATION_PAGE_SIZE;
      }

      return mergeDrawParticipationIntoNotices(notices, participationRows, viewerId);
    },
  });

  useEffect(() => {
    if (!broadcastId) return;

    const channel = supabase
      .channel(`live-interaction-notices-${broadcastId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_message",
          filter: `broadcast_id=eq.${broadcastId}`,
        },
        (payload) => {
          const row =
            payload.new && typeof payload.new === "object"
              ? (payload.new as Record<string, unknown>)
              : null;

          if (row?.message_type !== "moderation_notice") return;

          const metadata = readJsonObject((row.metadata ?? null) as Json);
          const source = readString(metadata.source);
          const isInteractionNotice = source === "live_interaction";
          const isDrawParticipation = source === LIVE_DRAW_PARTICIPATION_SOURCE;

          if (!isInteractionNotice && !isDrawParticipation) return;

          void queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.live.interactionNotices(broadcastId, viewerId),
          });
        },
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [broadcastId, viewerId, supabase, queryClient]);

  useEffect(() => {
    if (!broadcastId) return;

    function clearPendingRouletteResult() {
      if (!rouletteResultTimeoutRef.current) return;

      clearTimeout(rouletteResultTimeoutRef.current);
      rouletteResultTimeoutRef.current = null;
    }

    function commitRealtimeRouletteNotice(nextNotice: RealtimeRouletteNoticeState) {
      realtimeRouletteNoticeRef.current = nextNotice;
      setRealtimeRouletteNotice(nextNotice);
    }

    const eventSource = new EventSource(
      `/api/live/roulette/${encodeURIComponent(broadcastId)}/stream`,
    );

    eventSource.addEventListener(LIVE_ROULETTE_SSE_EVENT, (message) => {
      const eventMessage = message as MessageEvent<string>;

      try {
        const notice = readRouletteBroadcastNotice(JSON.parse(eventMessage.data));

        if (!notice) return;

        const receivedAtMs = Date.now();
        const currentRealtimeRouletteNotice =
          realtimeRouletteNoticeRef.current?.broadcastId === broadcastId
            ? realtimeRouletteNoticeRef.current
            : null;
        const delayMs = getLiveRouletteResultDelayMs({
          activeNotice: currentRealtimeRouletteNotice
            ? {
                durationSeconds: currentRealtimeRouletteNotice.notice.rouletteDurationSeconds,
                id: currentRealtimeRouletteNotice.notice.id,
                status: currentRealtimeRouletteNotice.notice.status,
              }
            : null,
          activeReceivedAtMs: currentRealtimeRouletteNotice?.receivedAtMs ?? null,
          nextNotice: { id: notice.id, status: notice.status },
          nowMs: receivedAtMs,
        });
        const nextRealtimeRouletteNotice = { broadcastId, notice, receivedAtMs };

        clearPendingRouletteResult();

        if (delayMs > 0) {
          rouletteResultTimeoutRef.current = setTimeout(() => {
            commitRealtimeRouletteNotice(nextRealtimeRouletteNotice);
            rouletteResultTimeoutRef.current = null;
          }, delayMs);
          return;
        }

        commitRealtimeRouletteNotice(nextRealtimeRouletteNotice);
      } catch (error) {
        console.error("라이브 룰렛 SSE 메시지 파싱 실패", error);
      }
    });

    return () => {
      clearPendingRouletteResult();
      eventSource.close();
    };
  }, [broadcastId]);

  const notices = useMemo(() => {
    const queryNotices = query.data ?? [];
    const currentRealtimeRoulette = realtimeRouletteNotice;
    let currentRealtimeRouletteNotice: LiveInteractionNotice | null = null;

    if (currentRealtimeRoulette && currentRealtimeRoulette.broadcastId === broadcastId) {
      currentRealtimeRouletteNotice = currentRealtimeRoulette.notice;
    }

    return currentRealtimeRouletteNotice
      ? [...queryNotices, currentRealtimeRouletteNotice]
      : queryNotices;
  }, [broadcastId, query.data, realtimeRouletteNotice]);

  return {
    error: query.error,
    isLoading: query.isLoading,
    notices,
  };
}
