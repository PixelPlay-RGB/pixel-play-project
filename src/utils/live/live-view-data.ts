// get_live_watch / get_live_watch_count RPC 응답을 시청 화면 도메인 데이터로 정규화합니다.

import { isRecord } from "@/utils/common/json";
import type { LiveWatchData, LiveWatchViewerRelation } from "@/types/live/live";

interface LiveWatchCountResult {
  followerCount: number;
  broadcastCount: number;
}

type RawLiveWatchData = Omit<
  LiveWatchData,
  | "creator"
  | "viewerRelation"
  | "viewerChatState"
  | "subscriptionBadgeCustomMonths"
  | "subscriptionBadgeVersion"
  | "subscriptionBadgeImageSources"
> & {
  creator: Omit<LiveWatchData["creator"], "followerCount" | "broadcastCount">;
  viewerRelation:
    | (Omit<
        LiveWatchViewerRelation,
        | "isSubscribed"
        | "subscriptionStartedAt"
        | "subscriptionEndAt"
        | "subscriptionTotalMonths"
        | "subscriptionStatus"
      > &
        Partial<
          Pick<
            LiveWatchViewerRelation,
            | "isSubscribed"
            | "subscriptionStartedAt"
            | "subscriptionEndAt"
            | "subscriptionTotalMonths"
            | "subscriptionStatus"
          >
        >)
    | null;
  viewerChatState: Omit<LiveWatchData["viewerChatState"], "chatUnavailableReason"> & {
    blockedReason: LiveWatchData["viewerChatState"]["chatUnavailableReason"];
  };
};

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
  if (isRecord(value.viewerRelation) && typeof value.viewerRelation.isFollowing !== "boolean")
    return false;

  return typeof value.creator.id === "string" && typeof value.creator.nickname === "string";
}

export function normalizeLiveViewData(
  rawWatchData: unknown,
  rawCountData: unknown,
): LiveWatchData | null {
  if (!isRawLiveWatchData(rawWatchData)) return null;

  const count = parseLiveWatchCount(rawCountData);
  const { blockedReason, ...restChatState } = rawWatchData.viewerChatState;
  const viewerRelation = rawWatchData.viewerRelation
    ? {
        ...rawWatchData.viewerRelation,
        isSubscribed: rawWatchData.viewerRelation.isSubscribed ?? false,
        subscriptionStartedAt: rawWatchData.viewerRelation.subscriptionStartedAt ?? null,
        subscriptionEndAt: rawWatchData.viewerRelation.subscriptionEndAt ?? null,
        subscriptionTotalMonths: rawWatchData.viewerRelation.subscriptionTotalMonths ?? null,
        subscriptionStatus: rawWatchData.viewerRelation.subscriptionStatus ?? null,
      }
    : null;

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
    viewerRelation,
    subscriptionBadgeCustomMonths: [],
    subscriptionBadgeVersion: null,
    subscriptionBadgeImageSources: {},
  };
}
