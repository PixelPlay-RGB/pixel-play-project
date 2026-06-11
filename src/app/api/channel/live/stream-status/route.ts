// MediaMTX Control API를 서버에서 대신 조회해 방송 송출 상태를 반환합니다.
import {
  CHANNEL_LIVE_MEDIA_CONFIG,
  getChannelLiveHlsUrl,
} from "@/constants/channel/channel-live-media";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createClient } from "@/lib/supabase/server";
import { mediaMtxPathResponseSchema, type MediaMtxPathResponse } from "@/lib/zod/channel-live";
import type { ChannelLiveStreamStatusResponse } from "@/types/channel/channel-live-stream";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_MEDIAMTX_API_BASE_URL = "http://live.pixel-play.studio:9997";
// EC2 mediamtx.yml의 authInternalUsers에 등록된 Control API 전용 계정과 동일해야 한다.
const MEDIAMTX_API_USER = "pixelplay-api";
const REQUEST_TIMEOUT_MS = 3000;
const DEFAULT_CONFIGURED_FPS = 30;

// Control API Basic 인증 헤더 — Vault 비밀번호(RPC)는 프로세스당 1회만 조회해 재사용한다.
let cachedMediaMtxAuthHeaderPromise: Promise<string | null> | null = null;

function getMediaMtxAuthHeader() {
  cachedMediaMtxAuthHeaderPromise ??= (async () => {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("get_mediamtx_api_password");

    if (error || typeof data !== "string" || !data) {
      console.error("MediaMTX API 비밀번호 조회 실패", error);
      // 조회 실패를 캐싱하면 영구히 무인증으로 호출하므로 다음 요청에서 재시도한다.
      cachedMediaMtxAuthHeaderPromise = null;
      return null;
    }

    return `Basic ${Buffer.from(`${MEDIAMTX_API_USER}:${data}`).toString("base64")}`;
  })();

  return cachedMediaMtxAuthHeaderPromise;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function trimTrailingSlashes(value: string) {
  return value.replace(/\/+$/g, "");
}

function getMediaMtxApiBaseUrl() {
  const configuredBaseUrl = process.env.MEDIAMTX_API_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  return DEFAULT_MEDIAMTX_API_BASE_URL;
}

function getVideoDimensions(pathData: MediaMtxPathResponse) {
  const tracks = pathData.tracks2;

  if (!tracks?.length) {
    return { height: null, width: null };
  }

  const videoTrack = tracks.find((track) => {
    return track.codec === "H264" || track.codec === "H265" || track.codec === "AV1";
  });

  if (!videoTrack?.codecProps) {
    return { height: null, width: null };
  }

  return {
    height: readNumber(videoTrack.codecProps.height),
    width: readNumber(videoTrack.codecProps.width),
  };
}

function createUnavailableResponse(
  streamPath: string,
  errorMessage: string,
): ChannelLiveStreamStatusResponse {
  return {
    checkedAt: new Date().toISOString(),
    errorMessage,
    fps: null,
    height: null,
    inboundBytes: null,
    onlineTime: null,
    state: "unavailable",
    streamPath,
    width: null,
  };
}

function createOfflineResponse(streamPath: string): ChannelLiveStreamStatusResponse {
  return {
    checkedAt: new Date().toISOString(),
    fps: null,
    height: null,
    inboundBytes: null,
    onlineTime: null,
    state: "offline",
    streamPath,
    width: null,
  };
}

async function getAuthenticatedUserId() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("자동 방송 썸네일 인증 사용자 조회 실패", error);
  }

  return user?.id ?? null;
}

export async function GET(request: NextRequest) {
  const streamPath =
    request.nextUrl.searchParams.get("path") ?? CHANNEL_LIVE_MEDIA_CONFIG.streamPath;
  const shouldCaptureAutoThumbnail = request.nextUrl.searchParams.get("autoThumbnail") === "1";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const mediaMtxApiBaseUrl = getMediaMtxApiBaseUrl();
    const authHeader = await getMediaMtxAuthHeader();
    const response = await fetch(
      `${trimTrailingSlashes(mediaMtxApiBaseUrl)}/v3/paths/get/${encodeURIComponent(streamPath)}`,
      {
        cache: "no-store",
        headers: authHeader ? { Authorization: authHeader } : undefined,
        signal: controller.signal,
      },
    );

    if (response.status === 404) {
      return NextResponse.json(createOfflineResponse(streamPath));
    }

    if (!response.ok) {
      return NextResponse.json(
        createUnavailableResponse(streamPath, `MediaMTX API 응답 실패: ${response.status}`),
      );
    }

    const pathData: unknown = await response.json();
    const parsedPathData = mediaMtxPathResponseSchema.safeParse(pathData);

    if (!parsedPathData.success) {
      console.error("MediaMTX 응답 형식 오류", parsedPathData.error);
      return NextResponse.json(
        createUnavailableResponse(streamPath, "MediaMTX API 응답 형식이 올바르지 않습니다."),
      );
    }

    const mediaMtxPathData = parsedPathData.data;
    const { height, width } = getVideoDimensions(mediaMtxPathData);
    const isOnline = mediaMtxPathData.online === true;
    let autoThumbnailUrl: string | null = null;

    if (isOnline && shouldCaptureAutoThumbnail) {
      const userId = await getAuthenticatedUserId();

      if (userId) {
        const { ensureChannelLiveAutoThumbnail } =
          await import("@/utils/channel/channel-live-auto-thumbnail");

        autoThumbnailUrl = await ensureChannelLiveAutoThumbnail({
          hlsUrl: getChannelLiveHlsUrl(streamPath),
          streamPath,
          userId,
        });
      }
    }

    return NextResponse.json({
      autoThumbnailUrl,
      checkedAt: new Date().toISOString(),
      // MediaMTX Control API does not expose live FPS, so show the baseline OBS setting.
      fps: isOnline ? DEFAULT_CONFIGURED_FPS : null,
      height,
      inboundBytes: readNumber(mediaMtxPathData.inboundBytes),
      onlineTime: isOnline ? readString(mediaMtxPathData.onlineTime) : null,
      state: isOnline ? "online" : "offline",
      streamPath,
      width,
    } satisfies ChannelLiveStreamStatusResponse);
  } catch (error) {
    console.error("MediaMTX 스트림 상태 조회 실패", error);

    return NextResponse.json(
      createUnavailableResponse(streamPath, "MediaMTX API에 연결할 수 없습니다."),
    );
  } finally {
    clearTimeout(timeout);
  }
}
