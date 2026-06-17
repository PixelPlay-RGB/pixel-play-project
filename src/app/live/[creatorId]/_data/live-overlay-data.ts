// OBS 오버레이 라우터에서 사용할 라이브 스냅샷을 조회합니다.
import "server-only";

import {
  LIVE_CHAT_OVERLAY_MESSAGE_LIMIT,
  LIVE_SECURITY_DEFAULT_TOKEN_VERSION,
} from "@/constants/live/live-overlay";
import { USER_MEDIA_BUCKET } from "@/constants/common/storage";
import { createAdminClient } from "@/lib/supabase/admin-client";
import type { LiveOverlayKind, LiveOverlayRouteParams } from "@/types/live/live";
import type { LiveChatOverlaySnapshot } from "@/types/live/live-chat-overlay";
import type { LiveDonationAlertOverlaySnapshot } from "@/types/live/live-donation-alert-overlay";
import {
  parseLiveChatOverlaySnapshot,
  parseLiveDonationAlertOverlaySnapshot,
} from "@/utils/live/live-overlay-parser";
import {
  LIVE_SUBSCRIPTION_BADGE_STORAGE_LIST_LIMIT,
  readLiveSubscriptionBadgeAssetInfo,
} from "@/utils/live/live-subscription-badge";
import { buildLiveOverlayKey } from "@/utils/live/live-security";

export async function getLiveChatOverlaySnapshot({
  creatorId,
  overlayKey,
}: LiveOverlayRouteParams): Promise<LiveChatOverlaySnapshot | null> {
  const supabase = createAdminClient();
  const isValidKey = await validateOverlayKey({ creatorId, overlayKey, kind: "chat" });

  if (!isValidKey) {
    return null;
  }

  const [snapshotResult, badgeAssetsResult] = await Promise.all([
    supabase.rpc("get_live_chat_overlay_snapshot", {
      p_creator_id: creatorId,
      p_limit: LIVE_CHAT_OVERLAY_MESSAGE_LIMIT,
    }),
    supabase.storage.from(USER_MEDIA_BUCKET).list(`${creatorId}/subscription`, {
      limit: LIVE_SUBSCRIPTION_BADGE_STORAGE_LIST_LIMIT,
      sortBy: { column: "name", order: "asc" },
    }),
  ]);

  if (snapshotResult.error) {
    console.error("OBS 채팅 오버레이 스냅샷 조회 실패", snapshotResult.error);
    return null;
  }

  if (badgeAssetsResult.error) {
    console.error("OBS 채팅 오버레이 구독 배지 목록 조회 실패", badgeAssetsResult.error);
  }

  const snapshot = parseLiveChatOverlaySnapshot(snapshotResult.data);
  if (!snapshot) {
    return null;
  }

  const badgeAssets = badgeAssetsResult.error
    ? { customMonths: [], version: null }
    : readLiveSubscriptionBadgeAssetInfo(badgeAssetsResult.data ?? null);

  return {
    ...snapshot,
    subscriptionBadgeCustomMonths: badgeAssets.customMonths,
    subscriptionBadgeVersion: badgeAssets.version,
  };
}

export async function getLiveDonationAlertOverlaySnapshot({
  creatorId,
  overlayKey,
}: LiveOverlayRouteParams): Promise<LiveDonationAlertOverlaySnapshot | null> {
  const supabase = createAdminClient();
  const isValidKey = await validateOverlayKey({ creatorId, overlayKey, kind: "donation" });

  if (!isValidKey) {
    return null;
  }

  const { data, error } = await supabase.rpc("get_live_donation_alert_overlay_snapshot", {
    p_creator_id: creatorId,
  });

  if (error) {
    console.error("OBS 후원 오버레이 스냅샷 조회 실패", error);
    return null;
  }

  return parseLiveDonationAlertOverlaySnapshot(data, creatorId);
}

async function validateOverlayKey({
  creatorId,
  overlayKey,
  kind,
}: LiveOverlayRouteParams & { kind: LiveOverlayKind }) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("creator_studio_setting")
    .select("chat_overlay_version, donation_alert_version")
    .eq("creator_id", creatorId)
    .maybeSingle();

  if (error) {
    console.error("OBS 오버레이 key 검증 실패", error);
    return false;
  }

  const version =
    kind === "chat"
      ? readTokenVersion(data?.chat_overlay_version)
      : readTokenVersion(data?.donation_alert_version);

  try {
    return overlayKey === buildLiveOverlayKey(kind, creatorId, version);
  } catch (error) {
    console.error("OBS 오버레이 key 생성 실패", error);
    return false;
  }
}

function readTokenVersion(version: number | null | undefined) {
  return typeof version === "number" && Number.isInteger(version) && version > 0
    ? version
    : LIVE_SECURITY_DEFAULT_TOKEN_VERSION;
}
