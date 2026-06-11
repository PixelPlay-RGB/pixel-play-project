import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// MediaMTX 송출 상태와 DB 방송 상태를 동기화한다(#111).
// pg_cron(1분 주기)이 호출하며, 송출이 끊긴 활성 방송을 end_live_broadcast로 자동 종료한다.
// 방송운영 페이지가 닫혀 있어도 동작하는 서버 책임 동기화 경로(브라우저 폴링은 보조 fallback).
// 종료 시 시청 화면 전달은 live_broadcast 트리거(broadcast_live_broadcast_ended)가 담당한다.

const DEFAULT_MEDIAMTX_API_BASE_URL = "http://live.pixel-play.studio:9997";
// RTMP 서버 URL(rtmp://live.pixel-play.studio/live)의 path 세그먼트와 동일해야 한다.
const STREAM_PATH_PREFIX = "live";
const LIVE_STREAM_KEY_LENGTH = 40;
// 방송 시작 버튼 직후 OBS 송출 전 상태를 종료로 오판하지 않도록 두는 유예.
const BROADCAST_START_GRACE_MS = 3 * 60 * 1000;
// 네트워크 순단(OBS 재접속)을 종료로 오판하지 않도록 재확인 전 대기.
const OFFLINE_RECHECK_DELAY_MS = 10 * 1000;
const MEDIAMTX_REQUEST_TIMEOUT_MS = 5 * 1000;
// end_live_broadcast가 이미 종료된 방송에 던지는 코드 — 운영 페이지 fallback과 경합 시 no-op.
const ACTIVE_LIVE_BROADCAST_NOT_FOUND_CODE = "PX404";

interface ActiveBroadcastRow {
  id: string;
  creator_id: string;
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

function getMediaMtxApiBaseUrl() {
  const configured = Deno.env.get("MEDIAMTX_API_BASE_URL")?.trim();

  return (configured || DEFAULT_MEDIAMTX_API_BASE_URL).replace(/\/+$/g, "");
}

// MediaMTX Control API에서 path 송출 여부를 확인한다. 404 = path 없음 = 송출 아님.
async function isStreamOnline(streamPath: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MEDIAMTX_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${getMediaMtxApiBaseUrl()}/v3/paths/get/${encodeURIComponent(streamPath)}`,
      { signal: controller.signal },
    );

    if (response.status === 404) return false;
    if (!response.ok) throw new Error(`MediaMTX API 응답 실패: ${response.status}`);

    const pathData: unknown = await response.json();
    const record = pathData as Record<string, unknown> | null;

    // 운영 중 MediaMTX는 online 필드를 주지만, 버전에 따라 ready만 주는 경우를 대비한다.
    return typeof record?.online === "boolean" ? record.online : record?.ready === true;
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (req: Request) => {
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // pg_cron이 Vault의 service_role_key를 Bearer로 전달한다 — 외부 임의 호출 차단.
  if (req.headers.get("Authorization") !== `Bearer ${serviceRoleKey}`) {
    return json({ error: "unauthorized" }, 401);
  }

  const liveStreamKeySecret = Deno.env.get("LIVE_OVERLAY_TOKEN_SECRET")?.trim();

  if (!liveStreamKeySecret) {
    return json({ error: "LIVE_OVERLAY_TOKEN_SECRET not configured" }, 503);
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

  // 1) 시작 유예가 지난 활성 방송만 검사 대상으로 모은다.
  const graceBoundary = new Date(Date.now() - BROADCAST_START_GRACE_MS).toISOString();
  const { data: broadcasts, error: broadcastError } = await supabase
    .from("live_broadcast")
    .select("id, creator_id")
    .is("ended_at", null)
    .lt("started_at", graceBoundary)
    .returns<ActiveBroadcastRow[]>();

  if (broadcastError) {
    console.error("[sync-live-broadcast-status] broadcast query error:", broadcastError.message);
    return json({ error: broadcastError.message }, 500);
  }

  if (!broadcasts?.length) {
    return json({ checked: 0, ended: [] });
  }

  // 2) 크리에이터별 stream key 버전으로 기대 MediaMTX path를 계산한다.
  const creatorIds = [...new Set(broadcasts.map((broadcast) => broadcast.creator_id))];
  const { data: settings, error: settingsError } = await supabase
    .from("creator_studio_setting")
    .select("creator_id, stream_key_version")
    .in("creator_id", creatorIds)
    .returns<StudioSettingRow[]>();

  if (settingsError) {
    console.error("[sync-live-broadcast-status] settings query error:", settingsError.message);
    return json({ error: settingsError.message }, 500);
  }

  const streamKeyVersionByCreatorId = new Map(
    (settings ?? []).map((setting) => [setting.creator_id, setting.stream_key_version]),
  );

  // 3) 1차 확인 — 송출이 안 잡히는 방송을 종료 후보로 모은다.
  //    Control API 장애(타임아웃 등)는 종료 판단을 보류하고 다음 주기에 재시도한다.
  const offlineCandidates: { broadcast: ActiveBroadcastRow; streamPath: string }[] = [];

  for (const broadcast of broadcasts) {
    const streamKey = await buildLiveStreamKey(
      liveStreamKeySecret,
      broadcast.creator_id,
      streamKeyVersionByCreatorId.get(broadcast.creator_id) ?? 1,
    );
    const streamPath = `${STREAM_PATH_PREFIX}/${streamKey}`;

    try {
      if (!(await isStreamOnline(streamPath))) {
        offlineCandidates.push({ broadcast, streamPath });
      }
    } catch (error) {
      console.error(
        "[sync-live-broadcast-status] first check failed:",
        broadcast.id,
        (error as Error).message,
      );
    }
  }

  if (!offlineCandidates.length) {
    return json({ checked: broadcasts.length, ended: [] });
  }

  // 4) 순단 보호 — 잠시 뒤 재확인해 여전히 송출이 없는 방송만 종료한다.
  await new Promise((resolve) => setTimeout(resolve, OFFLINE_RECHECK_DELAY_MS));

  const ended: string[] = [];

  for (const { broadcast, streamPath } of offlineCandidates) {
    try {
      if (await isStreamOnline(streamPath)) continue;

      const { error } = await supabase.rpc("end_live_broadcast", {
        p_actor_user_id: broadcast.creator_id,
        p_broadcast_id: broadcast.id,
      });

      if (error) {
        if (error.code !== ACTIVE_LIVE_BROADCAST_NOT_FOUND_CODE) {
          console.error("[sync-live-broadcast-status] end rpc error:", broadcast.id, error.message);
        }
        continue;
      }

      ended.push(broadcast.id);
      console.log("[sync-live-broadcast-status] ended:", broadcast.id);
    } catch (error) {
      console.error(
        "[sync-live-broadcast-status] recheck failed:",
        broadcast.id,
        (error as Error).message,
      );
    }
  }

  return json({ checked: broadcasts.length, ended });
});
