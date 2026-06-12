import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

// EC2 상주 클립 워커(폴러)의 두뇌 역할(#124) — 단일 POST + body.action 분기.
// - claim: 만료 정리 + pending 클립 원자 클레임(RPC) 후 스트림 path(HMAC 계산)와
//   서명된 업로드 URL(mp4/jpg)을 내려준다. EC2에는 service key를 전달하지 않는다.
// - complete/fail: 추출 결과 보고를 받아 상태를 전이한다. storage_path는 워커 입력을
//   믿지 않고 함수가 행 기준으로 재계산하며, complete는 업로드 객체 존재를 검증한다.
// ffmpeg 추출 자체는 EC2가 수행한다(MediaMTX 60초 HLS 버퍼는 EC2 로컬에만 존재).
// 인증: X-Clip-Worker-Secret 헤더를 Vault(get_live_clip_worker_secret)와 대조한다.

const CLIP_BUCKET = "user-media";
const CLIP_DIRECTORY = "clip";
const STREAM_PATH_PREFIX = "live";
const CLAIM_LIMIT = 2;
const LIVE_STREAM_KEY_LENGTH = 40;
const MAX_ERROR_REASON_LENGTH = 500;

interface ClaimedJob {
  clipId: string;
  creatorId: string;
  createdAt: string;
  durationSeconds: number;
  cropXFraction: number;
}

interface StudioSettingRow {
  creator_id: string;
  stream_key_version: number;
}

interface LiveClipRow {
  id: string;
  creator_id: string;
  status: string;
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

function clipObjectName(clipId: string, extension: "mp4" | "jpg") {
  return `${clipId}.${extension}`;
}

function clipObjectPath(creatorId: string, clipId: string, extension: "mp4" | "jpg") {
  return `${creatorId}/${CLIP_DIRECTORY}/${clipObjectName(clipId, extension)}`;
}

async function markClipFailed(supabase: SupabaseClient, clipId: string, reason: string) {
  const { error } = await supabase
    .from("live_clip")
    .update({ status: "failed", error_reason: reason.slice(0, MAX_ERROR_REASON_LENGTH) })
    .eq("id", clipId)
    .eq("status", "processing");

  if (error) {
    console.error("[clip-worker] mark failed error:", clipId, error.message);
  }
}

async function handleClaim(supabase: SupabaseClient) {
  const liveStreamKeySecret = Deno.env.get("LIVE_OVERLAY_TOKEN_SECRET")?.trim();

  if (!liveStreamKeySecret) {
    return json({ error: "LIVE_OVERLAY_TOKEN_SECRET not configured" }, 503);
  }

  const { data: claimed, error: claimError } = await supabase.rpc("claim_live_clip_jobs", {
    p_limit: CLAIM_LIMIT,
  });

  if (claimError) {
    console.error("[clip-worker] claim rpc error:", claimError.message);
    return json({ error: claimError.message }, 500);
  }

  const jobs = (claimed as ClaimedJob[] | null) ?? [];

  if (!jobs.length) {
    return json({ jobs: [] });
  }

  const creatorIds = [...new Set(jobs.map((job) => job.creatorId))];
  const { data: settings, error: settingsError } = await supabase
    .from("creator_studio_setting")
    .select("creator_id, stream_key_version")
    .in("creator_id", creatorIds)
    .returns<StudioSettingRow[]>();

  if (settingsError) {
    console.error("[clip-worker] settings query error:", settingsError.message);
    return json({ error: settingsError.message }, 500);
  }

  const streamKeyVersionByCreatorId = new Map(
    (settings ?? []).map((setting) => [setting.creator_id, setting.stream_key_version]),
  );

  const responseJobs = [];

  for (const job of jobs) {
    try {
      const streamKey = await buildLiveStreamKey(
        liveStreamKeySecret,
        job.creatorId,
        streamKeyVersionByCreatorId.get(job.creatorId) ?? 1,
      );

      const [video, thumbnail] = await Promise.all([
        supabase.storage
          .from(CLIP_BUCKET)
          .createSignedUploadUrl(clipObjectPath(job.creatorId, job.clipId, "mp4"), {
            upsert: true,
          }),
        supabase.storage
          .from(CLIP_BUCKET)
          .createSignedUploadUrl(clipObjectPath(job.creatorId, job.clipId, "jpg"), {
            upsert: true,
          }),
      ]);

      if (video.error || thumbnail.error) {
        throw new Error(video.error?.message ?? thumbnail.error?.message ?? "signed url error");
      }

      responseJobs.push({
        ...job,
        streamPath: `${STREAM_PATH_PREFIX}/${streamKey}`,
        videoUploadUrl: video.data.signedUrl,
        thumbnailUploadUrl: thumbnail.data.signedUrl,
      });
    } catch (error) {
      // 준비 실패한 job만 즉시 실패 처리하고 나머지는 계속 내려준다.
      const reason = error instanceof Error ? error.message : String(error);
      console.error("[clip-worker] claim setup error:", job.clipId, reason);
      await markClipFailed(supabase, job.clipId, `claim setup failed: ${reason}`);
    }
  }

  return json({ jobs: responseJobs });
}

async function handleComplete(supabase: SupabaseClient, clipId: string) {
  const { data: clip, error: clipError } = await supabase
    .from("live_clip")
    .select("id, creator_id, status")
    .eq("id", clipId)
    .maybeSingle<LiveClipRow>();

  if (clipError) {
    console.error("[clip-worker] complete query error:", clipError.message);
    return json({ error: clipError.message }, 500);
  }

  if (!clip) {
    return json({ error: "clip not found" }, 404);
  }

  if (clip.status !== "processing") {
    return json({ updated: false, reason: `status is ${clip.status}` }, 409);
  }

  // 업로드 객체 존재 검증 — 보고만 믿고 ready로 전환하지 않는다.
  const { data: objects, error: listError } = await supabase.storage
    .from(CLIP_BUCKET)
    .list(`${clip.creator_id}/${CLIP_DIRECTORY}`, { limit: 10, search: clipId });

  if (listError) {
    console.error("[clip-worker] storage list error:", listError.message);
    return json({ error: listError.message }, 500);
  }

  const objectNames = new Set((objects ?? []).map((object) => object.name));
  const hasVideo = objectNames.has(clipObjectName(clipId, "mp4"));
  const hasThumbnail = objectNames.has(clipObjectName(clipId, "jpg"));

  if (!hasVideo || !hasThumbnail) {
    await markClipFailed(supabase, clipId, "uploaded objects not found");
    return json({ updated: false, reason: "uploaded objects not found" }, 409);
  }

  const { error: updateError } = await supabase
    .from("live_clip")
    .update({
      status: "ready",
      storage_path: clipObjectPath(clip.creator_id, clipId, "mp4"),
      thumbnail_path: clipObjectPath(clip.creator_id, clipId, "jpg"),
    })
    .eq("id", clipId)
    .eq("status", "processing");

  if (updateError) {
    console.error("[clip-worker] complete update error:", updateError.message);
    return json({ error: updateError.message }, 500);
  }

  console.log("[clip-worker] ready:", clipId);

  return json({ updated: true });
}

async function handleFail(supabase: SupabaseClient, clipId: string, reason: string) {
  await markClipFailed(supabase, clipId, reason || "worker reported failure");

  console.log("[clip-worker] failed:", clipId, reason);

  return json({ updated: true });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

  // EC2 폴러는 X-Clip-Worker-Secret으로, 수동 점검은 service_role Bearer로 인증한다.
  const workerSecretHeader = req.headers.get("X-Clip-Worker-Secret");
  let isAuthorized = req.headers.get("Authorization") === `Bearer ${serviceRoleKey}`;

  if (!isAuthorized && workerSecretHeader) {
    const { data: workerSecret } = await supabase.rpc("get_live_clip_worker_secret");

    isAuthorized = typeof workerSecret === "string" && workerSecretHeader === workerSecret;
  }

  if (!isAuthorized) {
    return json({ error: "unauthorized" }, 401);
  }

  let body: { action?: string; clipId?: string; reason?: string };

  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json body" }, 400);
  }

  if (body.action === "claim") {
    return handleClaim(supabase);
  }

  if (body.action === "complete" || body.action === "fail") {
    if (!body.clipId) {
      return json({ error: "clipId required" }, 400);
    }

    return body.action === "complete"
      ? handleComplete(supabase, body.clipId)
      : handleFail(supabase, body.clipId, typeof body.reason === "string" ? body.reason : "");
  }

  return json({ error: "unknown action" }, 400);
});
