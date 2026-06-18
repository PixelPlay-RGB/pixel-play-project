// get_live_watch RPC 응답을 UI 도메인 모델로 정규화하는 순수 매핑 로직입니다.

import type {
  LiveBroadcast,
  LiveCreator,
  LiveWatchCreator,
  LiveWatchData,
} from "@/types/live/live";

// RPC의 크리에이터 응답을 UI에서 쓰는 LiveCreator로 정규화한다.
// 방송이 종료/오프라인이라 broadcast가 null이어도 크리에이터 정보는 살아 있어 종료 화면에서 쓴다.
export function mapLiveWatchCreator(creator: LiveWatchCreator): LiveCreator {
  return {
    id: creator.id,
    name: creator.nickname,
    avatarUrl: creator.photoUrl,
    followerCount: creator.followerCount,
    broadcastCount: creator.broadcastCount,
  };
}

export function mapLiveWatchToBroadcast(
  data: LiveWatchData | null | undefined,
): LiveBroadcast | null {
  if (!data?.broadcast) return null;

  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(data.broadcast.startedAt).getTime()) / 1000),
  );

  return {
    id: data.broadcast.id,
    creatorId: data.creator.id,
    title: data.broadcast.title,
    tags: data.broadcast.tags,
    viewerCount: data.broadcast.currentViewerCount,
    elapsedSeconds,
    creator: mapLiveWatchCreator(data.creator),
  };
}
