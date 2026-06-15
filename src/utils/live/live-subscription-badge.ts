// 라이브 구독 뱃지의 방송인별 storage 경로와 public URL을 생성합니다.

const LIVE_SUBSCRIPTION_BADGE_BUCKET = "user-media";
const LIVE_DEFAULT_SUBSCRIPTION_BADGE_VERSION = "20260615-fixed-slots-v1";
export const LIVE_SUBSCRIPTION_BADGE_VERSION_FILE = ".version";
export const LIVE_SUBSCRIPTION_BADGE_FIXED_MONTHS = [1, 2, 3, 6, 9, 12, 18] as const;
export const LIVE_SUBSCRIPTION_BADGE_MAX_MONTH = 120;
export const LIVE_SUBSCRIPTION_BADGE_MAX_DEFAULT_MONTH = 18;
export const LIVE_SUBSCRIPTION_BADGE_MIN_CUSTOM_MONTH = 19;

export interface LiveSubscriptionBadgeAssetInfo {
  customMonths: number[];
  version: string | null;
}

interface LiveSubscriptionBadgeStorageFile {
  name: string;
  updated_at?: string | null;
  created_at?: string | null;
  last_accessed_at?: string | null;
}

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

  return `/subscription-badges/${month}.png?v=${LIVE_DEFAULT_SUBSCRIPTION_BADGE_VERSION}`;
}

function readSubscriptionBadgeFileMonth(name: string) {
  if (!/^\d+\.png$/i.test(name)) return null;

  const month = Number(name.replace(/\.png$/i, ""));

  return isValidLiveSubscriptionBadgeMonth(month) ? month : null;
}

function readStorageFileVersion(file: LiveSubscriptionBadgeStorageFile) {
  const version = file.updated_at ?? file.created_at ?? file.last_accessed_at ?? null;

  if (!version || Number.isNaN(Date.parse(version))) {
    return null;
  }

  return version;
}

export function readLiveSubscriptionBadgeAssetInfo(
  files: readonly LiveSubscriptionBadgeStorageFile[] | null,
): LiveSubscriptionBadgeAssetInfo {
  const customMonths: number[] = [];
  let newestVersion: string | null = null;
  let newestVersionMs = -1;

  for (const file of files ?? []) {
    const badgeMonth = readSubscriptionBadgeFileMonth(file.name);
    const isVersionFile = file.name === LIVE_SUBSCRIPTION_BADGE_VERSION_FILE;

    if (badgeMonth === null && !isVersionFile) {
      continue;
    }

    if (badgeMonth !== null && badgeMonth >= LIVE_SUBSCRIPTION_BADGE_MIN_CUSTOM_MONTH) {
      customMonths.push(badgeMonth);
    }

    const version = readStorageFileVersion(file);
    if (!version) {
      continue;
    }

    const versionMs = Date.parse(version);
    if (versionMs > newestVersionMs) {
      newestVersion = version;
      newestVersionMs = versionMs;
    }
  }

  return {
    customMonths: Array.from(new Set(customMonths)).sort((a, b) => a - b),
    version: newestVersion,
  };
}

export function getLiveSubscriptionBadgePublicUrl(
  creatorId: string,
  totalMonths?: number | null,
  customMonths: readonly number[] = [],
  version?: string | null,
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const path = getLiveSubscriptionBadgeStoragePath(creatorId, totalMonths, customMonths);
  const encodedPath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const url = `${supabaseUrl}/storage/v1/object/public/${LIVE_SUBSCRIPTION_BADGE_BUCKET}/${encodedPath}`;
  const normalizedVersion = typeof version === "string" ? version.trim() : "";

  return normalizedVersion ? `${url}?v=${encodeURIComponent(normalizedVersion)}` : url;
}
