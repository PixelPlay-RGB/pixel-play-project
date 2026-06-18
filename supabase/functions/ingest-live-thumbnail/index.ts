import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// EC2 캡처 타이머(systemd, 1분)가 송출 중인 스트림의 프레임(JPEG)을 push하면
// 활성 방송에 매핑해 Storage(user-media/{creatorId}/live-thumbnail/auto-thumbnail.jpg)에
// upsert하고, 썸네일이 비어 있는 방송이면 thumbnail_url을 1회 기록한다.
// 인증: X-Capture-Secret 헤더를 Vault(get_live_thumbnail_ingest_secret)와 대조한다.
// 캡처 자체(ffmpeg)는 Vercel·Edge 런타임에서 불가능해 EC2가 수행한다 — 함수는 두뇌 역할만.

const STREAM_PATH_PREFIX = "live";
// sync-live-broadcast-status와 동일 — 이 시점 이전 시작 방송은 시드 데이터로 간주해 제외.
const SEED_BROADCAST_CUTOFF = "2026-06-01T00:00:00Z";
const LIVE_STREAM_KEY_PATTERN = /^pp_live_[0-9a-f]{40}$/;
const LIVE_THUMBNAIL_BUCKET = "user-media";
const LIVE_THUMBNAIL_DIRECTORY = "live-thumbnail";
const LIVE_AUTO_THUMBNAIL_FILE_NAME = "auto-thumbnail.jpg";
const MAX_FRAME_BYTES = 5 * 1024 * 1024;
const LIVE_STREAM_KEY_LENGTH = 40;

interface ActiveBroadcastRow {
  id: string;
  creator_id: string;
  thumbnail_url: string | null;
}

interface StudioSettingRow {
  creator_id: string;
  stream_key_version: number;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// src/utils/live/live-security.ts의 buildLiveStreamKey와 동일한 HMAC 계산(Deno Web Crypto).
async function buildLiveStreamKey(secret: string, creatorId: string, version: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`stream:${creatorId}:${version}`),
  );
  const token = [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, LIVE_STREAM_KEY_LENGTH);

  return `pp_live_${token}`;
}

function isAutoLiveThumbnailUrl(url: string | null) {
  return Boolean(url?.includes(`/${LIVE_THUMBNAIL_DIRECTORY}/${LIVE_AUTO_THUMBNAIL_FILE_NAME}`));
}

function isJpeg(bytes: Uint8Array) {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

  // EC2 푸셔는 X-Capture-Secret으로, 수동 점검은 service_role Bearer로 인증한다.
  const captureSecretHeader = req.headers.get("X-Capture-Secret");
  let isAuthorized = req.headers.get("Authorization") === `Bearer ${serviceRoleKey}`;

  if (!isAuthorized && captureSecretHeader) {
    const { data: ingestSecret } = await supabase.rpc("get_live_thumbnail_ingest_secret");

    isAuthorized = typeof ingestSecret === "string" && captureSecretHeader === ingestSecret;
  }

  if (!isAuthorized) {
    return json({ error: "unauthorized" }, 401);
  }

  const liveStreamKeySecret = Deno.env.get("LIVE_OVERLAY_TOKEN_SECRET")?.trim();

  if (!liveStreamKeySecret) {
    return json({ error: "LIVE_OVERLAY_TOKEN_SECRET not configured" }, 503);
  }

  // 경로 검증 — live/pp_live_<hex40> 형태만 받는다.
  const streamPath = new URL(req.url).searchParams.get("path") ?? "";
  const [prefix, streamKey] = streamPath.split("/");

  if (prefix !== STREAM_PATH_PREFIX || !streamKey || !LIVE_STREAM_KEY_PATTERN.test(streamKey)) {
    return json({ error: "invalid stream path" }, 400);
  }

  const frameBytes = new Uint8Array(await req.arrayBuffer());

  if (!frameBytes.length || frameBytes.length > MAX_FRAME_BYTES || !isJpeg(frameBytes)) {
    return json({ error: "invalid jpeg frame" }, 400);
  }

  // 활성 방송(시드 제외)의 기대 stream key를 계산해 push된 path와 대조한다.
  const { data: broadcasts, error: broadcastError } = await supabase
    .from("live_broadcast")
    .select("id, creator_id, thumbnail_url")
    .is("ended_at", null)
    .gte("started_at", SEED_BROADCAST_CUTOFF)
    .order("started_at", { ascending: false })
    .returns<ActiveBroadcastRow[]>();

  if (broadcastError) {
    console.error("[ingest-live-thumbnail] broadcast query error:", broadcastError.message);
    return json({ error: broadcastError.message }, 500);
  }

  if (!broadcasts?.length) {
    return json({ matched: false, reason: "no active broadcasts" }, 404);
  }

  const creatorIds = [...new Set(broadcasts.map((broadcast) => broadcast.creator_id))];
  const { data: settings, error: settingsError } = await supabase
    .from("creator_studio_setting")
    .select("creator_id, stream_key_version")
    .in("creator_id", creatorIds)
    .returns<StudioSettingRow[]>();

  if (settingsError) {
    console.error("[ingest-live-thumbnail] settings query error:", settingsError.message);
    return json({ error: settingsError.message }, 500);
  }

  const streamKeyVersionByCreatorId = new Map(
    (settings ?? []).map((setting) => [setting.creator_id, setting.stream_key_version]),
  );

  let matchedBroadcast: ActiveBroadcastRow | null = null;

  for (const broadcast of broadcasts) {
    const expectedKey = await buildLiveStreamKey(
      liveStreamKeySecret,
      broadcast.creator_id,
      streamKeyVersionByCreatorId.get(broadcast.creator_id) ?? 1,
    );

    if (expectedKey === streamKey) {
      matchedBroadcast = broadcast;
      break;
    }
  }

  if (!matchedBroadcast) {
    return json({ matched: false, reason: "no matching broadcast" }, 404);
  }

  // 크리에이터가 수동 썸네일을 설정한 방송은 자동 캡처가 덮지 않는다.
  if (matchedBroadcast.thumbnail_url && !isAutoLiveThumbnailUrl(matchedBroadcast.thumbnail_url)) {
    return json({ matched: true, skipped: "manual thumbnail" });
  }

  const storagePath = `${matchedBroadcast.creator_id}/${LIVE_THUMBNAIL_DIRECTORY}/${LIVE_AUTO_THUMBNAIL_FILE_NAME}`;
  const { error: uploadError } = await supabase.storage
    .from(LIVE_THUMBNAIL_BUCKET)
    .upload(storagePath, frameBytes, {
      cacheControl: "60",
      contentType: "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    console.error("[ingest-live-thumbnail] upload error:", uploadError.message);
    return json({ error: uploadError.message }, 500);
  }

  // URL은 방송당 1회만 기록한다 — 이후에는 같은 객체를 덮어써 내용만 갱신된다(cacheControl 60).
  let updated = false;

  if (!matchedBroadcast.thumbnail_url) {
    const {
      data: { publicUrl },
    } = supabase.storage.from(LIVE_THUMBNAIL_BUCKET).getPublicUrl(storagePath);
    const { error: updateError } = await supabase
      .from("live_broadcast")
      .update({ thumbnail_url: `${publicUrl}?t=${Date.now()}` })
      .eq("id", matchedBroadcast.id)
      .is("thumbnail_url", null);

    if (updateError) {
      console.error("[ingest-live-thumbnail] update error:", updateError.message);
      return json({ error: updateError.message }, 500);
    }

    updated = true;
  }

  console.log(
    "[ingest-live-thumbnail] stored:",
    matchedBroadcast.id,
    `bytes=${frameBytes.length}`,
    `updated=${updated}`,
  );

  return json({ matched: true, broadcastId: matchedBroadcast.id, updated });
});
