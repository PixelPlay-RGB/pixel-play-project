// MediaMTX HLS 스트림에서 자동 라이브 썸네일을 캡쳐하고 Storage에 저장합니다.

import { createAdminClient } from "@/lib/supabase/admin-client";
import {
  LIVE_AUTO_THUMBNAIL_FILE_NAME,
  LIVE_THUMBNAIL_DIRECTORY,
} from "@/utils/channel/channel-live-thumbnail";

const LIVE_THUMBNAIL_BUCKET = "user-media";
const AUTO_THUMBNAIL_CONTENT_TYPE = "image/jpeg";
const AUTO_THUMBNAIL_MIN_CAPTURE_INTERVAL_MS = 60_000;
const AUTO_THUMBNAIL_CAPTURE_TIMEOUT_MS = 5_000;

interface AutoThumbnailState {
  lastAttemptAt: number;
  publicUrl: string | null;
}

interface EnsureChannelLiveAutoThumbnailInput {
  hlsUrl: string;
  streamPath: string;
  userId: string;
}

const autoThumbnailStateByKey = new Map<string, AutoThumbnailState>();

function getFfmpegPath() {
  return process.env.FFMPEG_PATH?.trim() || "ffmpeg";
}

function getAutoThumbnailStoragePath(userId: string) {
  return `${userId}/${LIVE_THUMBNAIL_DIRECTORY}/${LIVE_AUTO_THUMBNAIL_FILE_NAME}`;
}

function appendCacheBuster(url: string) {
  return `${url}?t=${Date.now()}`;
}

function shouldAttemptCapture(key: string) {
  const state = autoThumbnailStateByKey.get(key);

  if (!state) return true;

  return Date.now() - state.lastAttemptAt >= AUTO_THUMBNAIL_MIN_CAPTURE_INTERVAL_MS;
}

function rememberCaptureAttempt(key: string, publicUrl: string | null) {
  autoThumbnailStateByKey.set(key, {
    lastAttemptAt: Date.now(),
    publicUrl,
  });
}

async function captureHlsFrame(hlsUrl: string) {
  const { execFile } = await import("node:child_process");

  return new Promise<Buffer>((resolve, reject) => {
    execFile(
      getFfmpegPath(),
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        hlsUrl,
        "-frames:v",
        "1",
        "-vf",
        "scale=1280:-2",
        "-q:v",
        "4",
        "-f",
        "image2pipe",
        "-vcodec",
        "mjpeg",
        "pipe:1",
      ],
      {
        encoding: "buffer",
        maxBuffer: 5 * 1024 * 1024,
        timeout: AUTO_THUMBNAIL_CAPTURE_TIMEOUT_MS,
      },
      (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }

        if (!Buffer.isBuffer(stdout) || stdout.length === 0) {
          reject(new Error("자동 방송 썸네일 캡쳐 결과가 비어 있습니다."));
          return;
        }

        resolve(stdout);
      },
    );
  });
}

async function saveAutoThumbnailUrlToActiveBroadcast(userId: string, thumbnailUrl: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("live_broadcast")
    .update({ thumbnail_url: thumbnailUrl })
    .eq("creator_id", userId)
    .is("ended_at", null)
    .is("thumbnail_url", null);

  if (error) {
    console.error("자동 방송 썸네일 DB 저장 실패", error);
  }
}

export async function ensureChannelLiveAutoThumbnail({
  hlsUrl,
  streamPath,
  userId,
}: EnsureChannelLiveAutoThumbnailInput) {
  const cacheKey = `${userId}:${streamPath}`;
  const cachedState = autoThumbnailStateByKey.get(cacheKey);

  if (!shouldAttemptCapture(cacheKey)) {
    return cachedState?.publicUrl ?? null;
  }

  rememberCaptureAttempt(cacheKey, cachedState?.publicUrl ?? null);

  try {
    const fileBuffer = await captureHlsFrame(hlsUrl);
    const storagePath = getAutoThumbnailStoragePath(userId);
    const supabase = createAdminClient();
    const { error: uploadError } = await supabase.storage
      .from(LIVE_THUMBNAIL_BUCKET)
      .upload(storagePath, fileBuffer, {
        cacheControl: "60",
        contentType: AUTO_THUMBNAIL_CONTENT_TYPE,
        upsert: true,
      });

    if (uploadError) {
      console.error("자동 방송 썸네일 업로드 실패", uploadError);
      rememberCaptureAttempt(cacheKey, cachedState?.publicUrl ?? null);
      return cachedState?.publicUrl ?? null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(LIVE_THUMBNAIL_BUCKET).getPublicUrl(storagePath);

    if (!publicUrl) {
      rememberCaptureAttempt(cacheKey, cachedState?.publicUrl ?? null);
      return cachedState?.publicUrl ?? null;
    }

    const cacheBustedUrl = appendCacheBuster(publicUrl);
    rememberCaptureAttempt(cacheKey, cacheBustedUrl);
    await saveAutoThumbnailUrlToActiveBroadcast(userId, cacheBustedUrl);

    return cacheBustedUrl;
  } catch (error) {
    console.error("자동 방송 썸네일 캡쳐 실패", error);
    rememberCaptureAttempt(cacheKey, cachedState?.publicUrl ?? null);

    return cachedState?.publicUrl ?? null;
  }
}
