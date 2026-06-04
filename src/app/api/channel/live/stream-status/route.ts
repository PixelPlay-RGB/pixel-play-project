// MediaMTX Control API를 서버에서 대신 조회해 방송 송출 상태를 반환합니다.
import { CHANNEL_LIVE_MEDIA_CONFIG } from "@/constants/channel/channel-live-media";
import type { ChannelLiveStreamStatusResponse } from "@/types/channel/channel-live-stream";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const LOCAL_MEDIAMTX_API_BASE_URL = "http://127.0.0.1:9997";
const REQUEST_TIMEOUT_MS = 3000;
const DEFAULT_CONFIGURED_FPS = 30;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

  if (process.env.NODE_ENV !== "production") {
    return LOCAL_MEDIAMTX_API_BASE_URL;
  }

  throw new Error("MEDIAMTX_API_BASE_URL 환경 변수가 필요합니다.");
}

function getVideoDimensions(pathData: Record<string, unknown>) {
  const tracks = pathData.tracks2;

  if (!Array.isArray(tracks)) {
    return { height: null, width: null };
  }

  const videoTrack = tracks.find((track) => {
    if (!isRecord(track)) return false;

    const codec = readString(track.codec);
    return codec === "H264" || codec === "H265" || codec === "AV1";
  });

  if (!isRecord(videoTrack) || !isRecord(videoTrack.codecProps)) {
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

export async function GET(request: NextRequest) {
  const streamPath =
    request.nextUrl.searchParams.get("path") ?? CHANNEL_LIVE_MEDIA_CONFIG.streamPath;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const mediaMtxApiBaseUrl = getMediaMtxApiBaseUrl();
    const response = await fetch(
      `${trimTrailingSlashes(mediaMtxApiBaseUrl)}/v3/paths/get/${encodeURIComponent(streamPath)}`,
      {
        cache: "no-store",
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

    if (!isRecord(pathData)) {
      return NextResponse.json(
        createUnavailableResponse(streamPath, "MediaMTX API 응답 형식이 올바르지 않습니다."),
      );
    }

    const { height, width } = getVideoDimensions(pathData);
    const isOnline = pathData.online === true;

    return NextResponse.json({
      checkedAt: new Date().toISOString(),
      // MediaMTX Control API does not expose live FPS, so show the baseline OBS setting.
      fps: isOnline ? DEFAULT_CONFIGURED_FPS : null,
      height,
      inboundBytes: readNumber(pathData.inboundBytes),
      onlineTime: isOnline ? readString(pathData.onlineTime) : null,
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
