// 라이브 구독 뱃지의 방송인별 storage 경로와 public URL을 생성합니다.

const LIVE_SUBSCRIPTION_BADGE_BUCKET = "user-media";
export const LIVE_SUBSCRIPTION_BADGE_MAX_MONTH = 12;

export function normalizeLiveSubscriptionBadgeMonth(totalMonths?: number | null) {
  if (!Number.isFinite(totalMonths) || !totalMonths) return 1;

  return Math.min(Math.max(Math.floor(totalMonths), 1), LIVE_SUBSCRIPTION_BADGE_MAX_MONTH);
}

export function getLiveSubscriptionBadgeStoragePath(
  creatorId: string,
  totalMonths?: number | null,
) {
  const month = normalizeLiveSubscriptionBadgeMonth(totalMonths);

  return `${creatorId}/subscription/${month}.png`;
}

export function getLiveSubscriptionBadgePublicUrl(creatorId: string, totalMonths?: number | null) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const path = getLiveSubscriptionBadgeStoragePath(creatorId, totalMonths);
  const encodedPath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${supabaseUrl}/storage/v1/object/public/${LIVE_SUBSCRIPTION_BADGE_BUCKET}/${encodedPath}`;
}
