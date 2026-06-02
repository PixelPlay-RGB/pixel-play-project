// get_live_watch / get_live_watch_count RPC 응답을 시청 화면 도메인 데이터로 정규화합니다.

import type { LiveWatchData } from "@/types/live/live";

interface LiveWatchCountResult {
  followerCount: number;
  broadcastCount: number;
}

type RawLiveWatchData = Omit<LiveWatchData, "creator" | "viewerChatState"> & {
  creator: Omit<LiveWatchData["creator"], "followerCount" | "broadcastCount">;
  viewerChatState: Omit<LiveWatchData["viewerChatState"], "chatUnavailableReason"> & {
    blockedReason: LiveWatchData["viewerChatState"]["chatUnavailableReason"];
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function parseLiveWatchCount(raw: unknown): LiveWatchCountResult {
  if (!isRecord(raw)) {
    return { followerCount: 0, broadcastCount: 0 };
  }

  return {
    followerCount: typeof raw.followerCount === "number" ? raw.followerCount : 0,
    broadcastCount: typeof raw.broadcastCount === "number" ? raw.broadcastCount : 0,
  };
}

function isRawLiveWatchData(value: unknown): value is RawLiveWatchData {
  if (!isRecord(value)) return false;
  if (!isRecord(value.creator)) return false;
  if (!isRecord(value.viewerChatState)) return false;
  if (value.viewerRelation !== null && !isRecord(value.viewerRelation)) return false;
  if (isRecord(value.viewerRelation) && typeof value.viewerRelation.isFollowing !== "boolean") return false;

  return typeof value.creator.id === "string" && typeof value.creator.nickname === "string";
}

export function normalizeLiveViewData(
  rawWatchData: unknown,
  rawCountData: unknown,
): LiveWatchData | null {
  if (!isRawLiveWatchData(rawWatchData)) return null;

  const count = parseLiveWatchCount(rawCountData);
  const { blockedReason, ...restChatState } = rawWatchData.viewerChatState;

  return {
    ...rawWatchData,
    creator: {
      ...rawWatchData.creator,
      followerCount: count.followerCount,
      broadcastCount: count.broadcastCount,
    },
    viewerChatState: {
      ...restChatState,
      chatUnavailableReason: blockedReason,
    },
  };
}
