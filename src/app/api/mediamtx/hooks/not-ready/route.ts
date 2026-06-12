// MediaMTX not-ready hook을 받아 활성 방송을 자동 종료합니다.
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getChannelLiveStreamPath } from "@/constants/channel/channel-live-media";
import { createAdminClient } from "@/lib/supabase/admin-client";
import type { Database } from "@/types/database.types";
import {
  findActiveBroadcastForMediaMtxPath,
  type MediaMtxActiveBroadcastCandidate,
} from "@/utils/live/mediamtx-hook";
import { buildLiveStreamKey } from "@/utils/live/live-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MEDIAMTX_HOOK_SECRET_HEADER = "x-mediamtx-hook-secret";
const ACTIVE_LIVE_BROADCAST_NOT_FOUND_CODE = "PX404";
const ACTIVE_LIVE_BROADCAST_NOT_FOUND_MESSAGE = "active live broadcast not found";

type ActiveBroadcastRow = Pick<
  Database["public"]["Tables"]["live_broadcast"]["Row"],
  "creator_id" | "id"
>;
type StudioSettingRow = Pick<
  Database["public"]["Tables"]["creator_studio_setting"]["Row"],
  "creator_id" | "stream_key_version"
>;

interface MediaMtxNotReadyPayload {
  path: string;
  sourceId: string | null;
  sourceType: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(value: unknown) {
  const text = readString(value);

  return text ? text : null;
}

function readFirstString(...values: unknown[]) {
  for (const value of values) {
    const text = readString(value);

    if (text) return text;
  }

  return "";
}

function isActiveLiveBroadcastNotFoundError(error: unknown) {
  if (!isRecord(error)) return false;

  return (
    error.code === ACTIVE_LIVE_BROADCAST_NOT_FOUND_CODE &&
    error.message === ACTIVE_LIVE_BROADCAST_NOT_FOUND_MESSAGE
  );
}

async function readJsonBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    const body: unknown = await request.json();

    return isRecord(body) ? body : null;
  } catch {
    return null;
  }
}

async function readPayload(request: NextRequest): Promise<MediaMtxNotReadyPayload | null> {
  const body = request.method === "POST" ? await readJsonBody(request) : null;
  const searchParams = request.nextUrl.searchParams;
  const path = readFirstString(
    searchParams.get("path") ?? searchParams.get("MTX_PATH") ?? searchParams.get("mtxPath"),
    body?.path,
    body?.MTX_PATH,
    body?.mtxPath,
  );

  if (!path) return null;

  return {
    path,
    sourceId:
      searchParams.get("source_id") ??
      searchParams.get("sourceId") ??
      readOptionalString(body?.source_id) ??
      readOptionalString(body?.sourceId) ??
      readOptionalString(body?.MTX_SOURCE_ID),
    sourceType:
      searchParams.get("source_type") ??
      searchParams.get("sourceType") ??
      readOptionalString(body?.source_type) ??
      readOptionalString(body?.sourceType) ??
      readOptionalString(body?.MTX_SOURCE_TYPE),
  };
}

function readExpectedSecret() {
  return process.env.MEDIAMTX_HOOK_SECRET?.trim() ?? "";
}

function readRequestSecret(request: NextRequest) {
  return (
    request.headers.get(MEDIAMTX_HOOK_SECRET_HEADER)?.trim() ??
    request.nextUrl.searchParams.get("secret")?.trim() ??
    ""
  );
}

function createExpectedStreamPath(candidate: MediaMtxActiveBroadcastCandidate) {
  return getChannelLiveStreamPath(
    buildLiveStreamKey(candidate.creatorId, candidate.streamKeyVersion),
  );
}

async function getActiveBroadcastCandidates() {
  const supabase = createAdminClient();
  const { data: broadcasts, error: broadcastError } = await supabase
    .from("live_broadcast")
    .select("id, creator_id")
    .is("ended_at", null)
    .returns<ActiveBroadcastRow[]>();

  if (broadcastError) {
    throw broadcastError;
  }

  const creatorIds = [...new Set((broadcasts ?? []).map((broadcast) => broadcast.creator_id))];

  if (!creatorIds.length) {
    return { candidates: [] as MediaMtxActiveBroadcastCandidate[], supabase };
  }

  const { data: settings, error: settingsError } = await supabase
    .from("creator_studio_setting")
    .select("creator_id, stream_key_version")
    .in("creator_id", creatorIds)
    .returns<StudioSettingRow[]>();

  if (settingsError) {
    throw settingsError;
  }

  const streamKeyVersionByCreatorId = new Map(
    (settings ?? []).map((setting) => [setting.creator_id, setting.stream_key_version]),
  );

  const candidates =
    broadcasts?.map((broadcast) => ({
      broadcastId: broadcast.id,
      creatorId: broadcast.creator_id,
      streamKeyVersion: streamKeyVersionByCreatorId.get(broadcast.creator_id) ?? 1,
    })) ?? [];

  return { candidates, supabase };
}

async function handleMediaMtxNotReadyHook(request: NextRequest) {
  const expectedSecret = readExpectedSecret();

  if (!expectedSecret) {
    return NextResponse.json(
      { ended: false, ok: false, reason: "hook_secret_not_configured" },
      { status: 503 },
    );
  }

  if (readRequestSecret(request) !== expectedSecret) {
    return NextResponse.json({ ended: false, ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const payload = await readPayload(request);

  if (!payload) {
    return NextResponse.json({ ended: false, ok: false, reason: "missing_path" }, { status: 400 });
  }

  try {
    const { candidates, supabase } = await getActiveBroadcastCandidates();
    const matched = findActiveBroadcastForMediaMtxPath({
      candidates,
      createStreamPath: createExpectedStreamPath,
      streamPath: payload.path,
    });

    if (!matched) {
      return NextResponse.json({
        ended: false,
        ok: true,
        reason: "active_broadcast_not_found_for_path",
      });
    }

    const { data: endedBroadcastId, error } = await supabase.rpc("end_live_broadcast", {
      p_actor_user_id: matched.creatorId,
      p_broadcast_id: matched.broadcastId,
    });

    if (error) {
      if (isActiveLiveBroadcastNotFoundError(error)) {
        return NextResponse.json({
          broadcastId: matched.broadcastId,
          creatorId: matched.creatorId,
          ended: false,
          ok: true,
          reason: "already_ended",
        });
      }

      throw error;
    }

    revalidatePath("/channel/live");
    revalidatePath(`/live/${matched.creatorId}`);

    return NextResponse.json({
      broadcastId: endedBroadcastId,
      creatorId: matched.creatorId,
      ended: true,
      ok: true,
      sourceId: payload.sourceId,
      sourceType: payload.sourceType,
    });
  } catch (error) {
    console.error("MediaMTX not-ready hook 처리 실패", error);

    return NextResponse.json(
      { ended: false, ok: false, reason: "internal_error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return handleMediaMtxNotReadyHook(request);
}

export async function POST(request: NextRequest) {
  return handleMediaMtxNotReadyHook(request);
}
