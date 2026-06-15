// 라이브 구독 뱃지의 방송인별 storage 경로와 public URL을 생성합니다.

const LIVE_SUBSCRIPTION_BADGE_BUCKET = "user-media";
export const LIVE_SUBSCRIPTION_BADGE_FIXED_MONTHS = [1, 2, 3, 6, 9, 12, 18] as const;
export const LIVE_SUBSCRIPTION_BADGE_MAX_MONTH = 120;
export const LIVE_SUBSCRIPTION_BADGE_MAX_DEFAULT_MONTH = 12;
export const LIVE_SUBSCRIPTION_BADGE_MIN_CUSTOM_MONTH = 19;

export function isValidLiveSubscriptionBadgeMonth(month: number) {
  return Number.isInteger(month) && month >= 1 && month <= LIVE_SUBSCRIPTION_BADGE_MAX_MONTH;
}

export function buildLiveSubscriptionBadgeMonths(customMonths: readonly number[] = []) {
  const fixed = [...LIVE_SUBSCRIPTION_BADGE_FIXED_MONTHS];
  const custom = customMonths.filter(isValidLiveSubscriptionBadgeMonth);

  return Array.from(new Set([...fixed, ...custom])).sort((a, b) => a - b);
}

export function resolveLiveSubscriptionBadgeMonth(
  totalMonths?: number | null,
  customMonths: readonly number[] = [],
) {
  const safeMonth =
    Number.isFinite(totalMonths) && totalMonths ? Math.floor(Number(totalMonths)) : 1;
  const clampedMonth = Math.min(Math.max(safeMonth, 1), LIVE_SUBSCRIPTION_BADGE_MAX_MONTH);
  const months = buildLiveSubscriptionBadgeMonths(customMonths);

  return months.reduce((selected, month) => (month <= clampedMonth ? month : selected), 1);
}

export function getLiveSubscriptionBadgeStoragePath(
  creatorId: string,
  totalMonths?: number | null,
  customMonths: readonly number[] = [],
) {
  const month = resolveLiveSubscriptionBadgeMonth(totalMonths, customMonths);

  return getLiveSubscriptionBadgeStoragePathByMonth(creatorId, month);
}

export function getLiveSubscriptionBadgeStoragePathByMonth(creatorId: string, month: number) {
  return `${creatorId}/subscription/${month}.png`;
}

export function getLiveDefaultSubscriptionBadgeSrc(totalMonths?: number | null) {
  const month = Math.min(
    resolveLiveSubscriptionBadgeMonth(totalMonths),
    LIVE_SUBSCRIPTION_BADGE_MAX_DEFAULT_MONTH,
  );

  return `/subscription-badges/${month}.png`;
}

export function getLiveSubscriptionBadgePublicUrl(
  creatorId: string,
  totalMonths?: number | null,
  customMonths: readonly number[] = [],
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const path = getLiveSubscriptionBadgeStoragePath(creatorId, totalMonths, customMonths);
  const encodedPath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${supabaseUrl}/storage/v1/object/public/${LIVE_SUBSCRIPTION_BADGE_BUCKET}/${encodedPath}`;
}
