// 채널 보안 설정 서버 snapshot 조회와 표시값 조립을 관리합니다.
import "server-only";

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import {
  LIVE_SECURITY_DEFAULT_TOKEN_VERSION,
  LIVE_STREAM_SERVER_URL,
} from "@/constants/live/live-overlay";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createClient } from "@/lib/supabase/server";
import type {
  ChannelSecuritySnapshot,
  CreatorStudioSnapshotSettings,
} from "@/types/channel/security";
import type { AppActionResult } from "@/types/common/action";
import type { Json } from "@/types/database.types";
import { isAuthSessionMissingError } from "@/utils/auth/auth-error";
import { buildLiveOverlayKey, buildLiveStreamKey } from "@/utils/live/live-security";

export async function getChannelSecuritySnapshot(): Promise<
  AppActionResult<ChannelSecuritySnapshot>
> {
  const serverClient = await createClient();
  const {
    data: { user },
    error: userError,
  } = await serverClient.auth.getUser();

  if (userError && !isAuthSessionMissingError(userError)) {
    console.error("채널 보안 설정 조회 중 인증 유저 조회 실패", userError);
  }

  if (!user) {
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.auth.authInfoNotFound,
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("get_creator_studio_snapshot", {
    p_actor_user_id: user.id,
  });

  if (error) {
    console.error("채널 보안 설정 조회 실패", error);
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.channel.securityLoadFailed,
    };
  }

  try {
    return {
      success: true,
      data: buildChannelSecuritySnapshot(user.id, data),
    };
  } catch (error) {
    console.error("채널 보안 표시값 생성 실패", error);
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.channel.securityLoadFailed,
    };
  }
}

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
