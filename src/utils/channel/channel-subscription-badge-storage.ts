// 채널 구독 배지 storage 목록 조회 + asset 파싱을 한 곳에서 처리합니다(서버 전용).
import "server-only";

import { USER_MEDIA_BUCKET } from "@/constants/common/storage";
import type { createAdminClient } from "@/lib/supabase/admin-client";
import {
  LIVE_SUBSCRIPTION_BADGE_STORAGE_LIST_LIMIT,
  readLiveSubscriptionBadgeAssetInfo,
  type LiveSubscriptionBadgeAssetInfo,
} from "@/utils/live/live-subscription-badge";

type AdminClient = ReturnType<typeof createAdminClient>;

// 방송인 구독 배지 폴더(user-media/{creatorId}/subscription)를 나열해 asset 정보로 변환한다.
// 목록 조회 실패는 로깅 후 빈 목록으로 흘려 호출부가 폴백 배지로만 떨어지게 한다.
export async function readChannelSubscriptionBadgeAssetsFromStorage(
  admin: AdminClient,
  creatorId: string,
): Promise<LiveSubscriptionBadgeAssetInfo> {
  const { data, error } = await admin.storage
    .from(USER_MEDIA_BUCKET)
    .list(`${creatorId}/subscription`, {
      limit: LIVE_SUBSCRIPTION_BADGE_STORAGE_LIST_LIMIT,
      sortBy: { column: "name", order: "asc" },
    });

  if (error) {
    console.error("채널 구독 배지 목록 조회 실패", error);
  }

  return readLiveSubscriptionBadgeAssetInfo(data ?? null);
}
