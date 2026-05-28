// 채널 보안 설정 snapshot의 화면 표시값을 조립합니다.
import "server-only";

import {
  LIVE_SECURITY_DEFAULT_TOKEN_VERSION,
  LIVE_STREAM_SERVER_URL,
} from "@/constants/live/live-overlay";
import type {
  ChannelSecuritySnapshot,
  CreatorStudioSnapshotSettings,
} from "@/types/channel/security";
import type { Json } from "@/types/database.types";
import { buildLiveOverlayKey, buildLiveStreamKey } from "@/utils/live/live-security";

export function buildChannelSecuritySnapshot(
  creatorId: string,
  snapshot: Json,
): ChannelSecuritySnapshot {
  const settings = readSettings(snapshot);
  const versions = {
    streamKey: readVersion(settings.streamKeyVersion),
    chatOverlay: readVersion(settings.chatOverlayVersion),
    donationAlert: readVersion(settings.donationAlertVersion),
  };

  return buildSnapshotFromVersions(creatorId, versions);
}

function buildSnapshotFromVersions(
  creatorId: string,
  versions: {
    streamKey: number;
    chatOverlay: number;
    donationAlert: number;
  },
): ChannelSecuritySnapshot {
  const baseUrl = resolvePublicBaseUrl();
  const streamKey = buildLiveStreamKey(creatorId, versions.streamKey);

  return {
    creatorId,
    streamServerUrl: LIVE_STREAM_SERVER_URL,
    streamKey,
    chatOverlayUrl: `${baseUrl}/live/${creatorId}/chat/${buildLiveOverlayKey(
      "chat",
      creatorId,
      versions.chatOverlay,
    )}`,
    donationAlertUrl: `${baseUrl}/live/${creatorId}/alerts/donation/${buildLiveOverlayKey(
      "donation",
      creatorId,
      versions.donationAlert,
    )}`,
    streamKeyVersion: versions.streamKey,
    chatOverlayVersion: versions.chatOverlay,
    donationAlertVersion: versions.donationAlert,
  };
}

function readSettings(snapshot: Json): CreatorStudioSnapshotSettings {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return {};
  }

  const settings = (snapshot as { settings?: unknown }).settings;

  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return {};
  }

  return settings as CreatorStudioSnapshotSettings;
}

function readVersion(version?: number): number {
  return typeof version === "number" && Number.isInteger(version) && version > 0
    ? version
    : LIVE_SECURITY_DEFAULT_TOKEN_VERSION;
}

function resolvePublicBaseUrl() {
  if (process.env.NODE_ENV === "production") {
    return "https://pixel-play.studio";
  }

  return "http://localhost:3000";
}
