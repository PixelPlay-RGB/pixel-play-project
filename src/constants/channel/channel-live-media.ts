// 방송 송출 서버와 미리보기 재생 주소 설정을 제공합니다.

import { LIVE_STREAM_SERVER_URL } from "@/constants/live/live-overlay";

const DEFAULT_MEDIAMTX_RTMP_SERVER_URL = "rtmp://3.34.211.173:1935";
const DEFAULT_MEDIAMTX_HLS_BASE_URL = "http://3.34.211.173:8888";
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

export const CHANNEL_LIVE_MEDIA_CONFIG = {
  rtmpServerUrl:
    process.env.NEXT_PUBLIC_MEDIAMTX_RTMP_SERVER_URL ?? DEFAULT_MEDIAMTX_RTMP_SERVER_URL,
  hlsBaseUrl: process.env.NEXT_PUBLIC_MEDIAMTX_HLS_BASE_URL ?? DEFAULT_MEDIAMTX_HLS_BASE_URL,
  streamPath: process.env.NEXT_PUBLIC_MEDIAMTX_STREAM_PATH ?? DEFAULT_MEDIAMTX_STREAM_PATH,
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
