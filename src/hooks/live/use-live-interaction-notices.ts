"use client";
// 라이브 상호작용 결과 공지를 기존 live_message metadata에서 조회합니다.

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { readJsonObject, readNumber, readString } from "@/utils/common/json";
import type { Json } from "@/types/database.types";
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

interface LiveDrawParticipationRow {
  metadata: Json;
}

const LIVE_INTERACTION_NOTICE_LIMIT = 20;
const LIVE_DRAW_PARTICIPATION_SOURCE = "live_draw_participation";

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

      if (!viewerId) {
        return notices;
      }

      const { data: participationRows, error: participationError } = await supabase
        .from("live_message")
        .select("metadata")
        .eq("broadcast_id", broadcastId)
        .eq("sender_id", viewerId)
        .eq("message_type", "moderation_notice")
        .contains("metadata", { source: LIVE_DRAW_PARTICIPATION_SOURCE })
        .returns<LiveDrawParticipationRow[]>();

      if (participationError) throw participationError;

      const joinedDrawNoticeIds = new Set(
        (participationRows ?? []).flatMap((row) => {
          const metadata = readJsonObject(row.metadata);
          const drawNoticeId = readString(metadata.drawNoticeId);

          return drawNoticeId ? [drawNoticeId] : [];
        }),
      );

      return notices.map((notice) =>
        notice.type === "draw"
          ? { ...notice, hasJoined: joinedDrawNoticeIds.has(notice.id) }
          : notice,
      );
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
          const isOwnDrawParticipation =
            source === LIVE_DRAW_PARTICIPATION_SOURCE && row.sender_id === viewerId;

          if (!isInteractionNotice && !isOwnDrawParticipation) return;

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

  return {
    error: query.error,
    isLoading: query.isLoading,
    notices: query.data ?? [],
  };
}
