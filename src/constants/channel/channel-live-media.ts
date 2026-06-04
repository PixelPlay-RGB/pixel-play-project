// 방송 송출 서버와 미리보기 재생 주소 설정을 제공합니다.

import { LIVE_STREAM_SERVER_URL } from "@/constants/live/live-overlay";

const LOCAL_MEDIAMTX_RTMP_SERVER_URL = "rtmp://127.0.0.1:1935";
const LOCAL_MEDIAMTX_HLS_BASE_URL = "http://127.0.0.1:8888";
const LOCAL_MEDIAMTX_STREAM_PATH = "mystream";

function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, "");
}

function trimTrailingSlashes(value: string) {
  return value.replace(/\/+$/g, "");
}

function getRtmpServerPath(value: string) {
  try {
    return trimSlashes(new URL(value).pathname);
  } catch {
    return "";
  }
}

function getMediaConfigValue(value: string | undefined, key: string, localDefault: string) {
  const configuredValue = value?.trim();

  if (configuredValue) {
    return configuredValue;
  }

  if (process.env.NODE_ENV !== "production") {
    return localDefault;
  }

  throw new Error(`${key} 환경 변수가 필요합니다.`);
}

export const CHANNEL_LIVE_MEDIA_CONFIG = {
  get rtmpServerUrl() {
    return getMediaConfigValue(
      process.env.NEXT_PUBLIC_MEDIAMTX_RTMP_SERVER_URL,
      "NEXT_PUBLIC_MEDIAMTX_RTMP_SERVER_URL",
      LOCAL_MEDIAMTX_RTMP_SERVER_URL,
    );
  },
  get hlsBaseUrl() {
    return getMediaConfigValue(
      process.env.NEXT_PUBLIC_MEDIAMTX_HLS_BASE_URL,
      "NEXT_PUBLIC_MEDIAMTX_HLS_BASE_URL",
      LOCAL_MEDIAMTX_HLS_BASE_URL,
    );
  },
  get streamPath() {
    return getMediaConfigValue(
      process.env.NEXT_PUBLIC_MEDIAMTX_STREAM_PATH,
      "NEXT_PUBLIC_MEDIAMTX_STREAM_PATH",
      LOCAL_MEDIAMTX_STREAM_PATH,
    );
  },
} as const;

export function getChannelLiveHlsUrl(streamPath = CHANNEL_LIVE_MEDIA_CONFIG.streamPath) {
  return `${trimTrailingSlashes(CHANNEL_LIVE_MEDIA_CONFIG.hlsBaseUrl)}/${trimSlashes(streamPath)}/index.m3u8`;
}

export function getChannelLiveStreamPath(
  streamKey: string,
  streamServerUrl = LIVE_STREAM_SERVER_URL,
) {
  const streamServerPath = getRtmpServerPath(streamServerUrl);
  const normalizedStreamKey = trimSlashes(streamKey);

  return streamServerPath ? `${streamServerPath}/${normalizedStreamKey}` : normalizedStreamKey;
}
