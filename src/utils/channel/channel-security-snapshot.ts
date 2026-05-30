// 채널 보안 설정 snapshot의 화면 표시값을 조립합니다.
import "server-only";

import {
  LIVE_SECURITY_DEFAULT_TOKEN_VERSION,
  LIVE_STREAM_SERVER_URL,
} from "@/constants/live/live-overlay";
import type {
  ChannelSecuritySnapshot,
  ChannelSecurityTokenKind,
  ChannelSecurityVersionResult,
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

export function buildChannelSecurityVersionResult(
  creatorId: string,
  value: Json,
): ChannelSecurityVersionResult {
  const object = readObject(value);

  if (!object) {
    throw new Error("채널 보안 토큰 재발급 응답 형식 오류");
  }

  const tokenKind = readTokenKind(object.tokenKind);
  const version = readStrictVersion(object.version);
  const snapshot = object.snapshot;

  if (!tokenKind || version === null || snapshot === undefined) {
    throw new Error("채널 보안 토큰 재발급 응답 필드 오류");
  }

  return {
    tokenKind,
    version,
    snapshot: buildChannelSecuritySnapshot(creatorId, snapshot),
  };
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
  const snapshotObject = readObject(snapshot);

  if (!snapshotObject) {
    return {};
  }

  const settings = readObject(snapshotObject.settings);

  return settings ? (settings as CreatorStudioSnapshotSettings) : {};
}

function readVersion(version?: number): number {
  return typeof version === "number" && Number.isInteger(version) && version > 0
    ? version
    : LIVE_SECURITY_DEFAULT_TOKEN_VERSION;
}

function readStrictVersion(value: Json | undefined) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

function readTokenKind(value: Json | undefined): ChannelSecurityTokenKind | null {
  return value === "stream_key" || value === "chat_overlay" || value === "donation_alert"
    ? value
    : null;
}

function readObject(value: Json | undefined): Record<string, Json | undefined> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, Json | undefined>;
}

function resolvePublicBaseUrl() {
  const configuredUrl = normalizePublicBaseUrl(process.env.NEXT_PUBLIC_SITE_URL);

  if (configuredUrl) {
    return configuredUrl;
  }

  const vercelUrl = normalizePublicBaseUrl(process.env.VERCEL_URL);

  return vercelUrl ?? "http://localhost:3000";
}

function normalizePublicBaseUrl(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`).origin;
  } catch {
    return null;
  }
}
