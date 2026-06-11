// 방송 송출 서버와 미리보기 재생 주소 설정을 제공합니다.

import { LIVE_STREAM_SERVER_URL } from "@/constants/live/live-overlay";

const DEFAULT_MEDIAMTX_RTMP_SERVER_URL = LIVE_STREAM_SERVER_URL;
const DEFAULT_MEDIAMTX_HLS_BASE_URL = "http://live.pixel-play.studio:8888";
const DEFAULT_MEDIAMTX_STREAM_PATH = "mystream";

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

function getMediaConfigValue(value: string | undefined, defaultValue: string) {
  const configuredValue = value?.trim();

  if (configuredValue) {
    return configuredValue;
  }

  return defaultValue;
}

function getHlsBaseUrl() {
  const configuredValue = process.env.NEXT_PUBLIC_MEDIAMTX_HLS_BASE_URL?.trim();

  if (configuredValue) {
    return configuredValue;
  }

  return DEFAULT_MEDIAMTX_HLS_BASE_URL;
}

export const CHANNEL_LIVE_MEDIA_CONFIG = {
  get rtmpServerUrl() {
    return getMediaConfigValue(
      process.env.NEXT_PUBLIC_MEDIAMTX_RTMP_SERVER_URL,
      DEFAULT_MEDIAMTX_RTMP_SERVER_URL,
    );
  },
  get hlsBaseUrl() {
    return getHlsBaseUrl();
  },
  get streamPath() {
    return getMediaConfigValue(
      process.env.NEXT_PUBLIC_MEDIAMTX_STREAM_PATH,
      DEFAULT_MEDIAMTX_STREAM_PATH,
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
