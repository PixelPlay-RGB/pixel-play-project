"use server";
// 라이브 클립 생성·조회수 RPC를 호출하는 서버 액션입니다.
// 추출·업로드는 EC2 워커가 비동기로 수행하므로 생성 액션은 pending 행 생성까지만 책임진다.

import { cookies } from "next/headers";

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createWriteClientForAction } from "@/actions/common/admin-client-action";
import { getAuthenticatedActorId } from "@/actions/common/authenticated-actor";
import {
  CLIP_BUFFER_SECONDS,
  CLIP_DURATION_MAX_SECONDS,
  CLIP_DURATION_MIN_SECONDS,
  CLIP_TITLE_MAX_LENGTH,
} from "@/constants/clip/clip";
import type { AppActionResult } from "@/types/common/action";
import { isKnownClipRpcError, resolveClipRpcErrorCode } from "@/utils/common/app-message";
import { isRecord } from "@/utils/common/json";
import { isUuid } from "@/utils/common/uuid";
import { resolveViewerId } from "@/utils/auth/viewer";

// 조회수 dedup용 뷰어 식별 쿠키(익명용). 로그인 유저는 user id를 우선 쓴다.
const CLIP_VIEWER_COOKIE = "clip_vk";
const CLIP_VIEWER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

// 조회수 1회 카운트 기준이 되는 뷰어 키 — 로그인 'u:{uid}' / 익명 'a:{cookie_uuid}'.
async function resolveClipViewerKey(): Promise<string | null> {
  const userId = await resolveViewerId();
  if (userId) return `u:${userId}`;

  const store = await cookies();
  const existing = store.get(CLIP_VIEWER_COOKIE)?.value;
  if (existing) return `a:${existing}`;

  const anonId = crypto.randomUUID();
  try {
    store.set(CLIP_VIEWER_COOKIE, anonId, {
      maxAge: CLIP_VIEWER_COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  } catch {
    // 일부 컨텍스트에선 쿠키 설정이 막힐 수 있다 — 이번 호출은 새 익명 키로 진행한다.
  }
  return `a:${anonId}`;
}

export interface CreateLiveClipInput {
  // 빈 문자열이면 RPC가 방송 제목으로 폴백한다(입력칸 기본값과 동일 규칙).
  title: string;
  durationSeconds: number;
  cropXFraction: number;
  // 클립 시점(now)으로부터 "윈도우 끝"까지의 거리(초). 0이면 직전 N초, 양수면 그만큼 과거로 당긴 구간.
  endOffsetSeconds: number;
}

export interface CreateLiveClipResult {
  clipId: string;
}

// create_live_clip의 jsonb 응답({ clipId })을 앱 타입으로 정규화한다.
function normalizeCreateLiveClipResult(data: unknown): CreateLiveClipResult | null {
  if (!isRecord(data)) return null;
  if (typeof data.clipId !== "string" || !isUuid(data.clipId)) return null;

  return { clipId: data.clipId };
}

export async function createLiveClipAction(
  creatorId: string,
  input: CreateLiveClipInput,
): Promise<AppActionResult<CreateLiveClipResult>> {
  const title = input.title.trim();
  const durationSeconds = Math.round(input.durationSeconds);
  const cropXFraction = input.cropXFraction;
  const endOffsetSeconds = Math.round(input.endOffsetSeconds);

  if (!creatorId || !isUuid(creatorId)) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  if (
    title.length > CLIP_TITLE_MAX_LENGTH ||
    durationSeconds < CLIP_DURATION_MIN_SECONDS ||
    durationSeconds > CLIP_DURATION_MAX_SECONDS ||
    !Number.isFinite(cropXFraction) ||
    cropXFraction < 0 ||
    cropXFraction > 1 ||
    !Number.isFinite(endOffsetSeconds) ||
    endOffsetSeconds < 0 ||
    endOffsetSeconds + durationSeconds > CLIP_BUFFER_SECONDS
  ) {
    return { success: false, code: APP_MESSAGE_CODE.error.clip.createFailed };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "클립 생성 중 인증 사용자 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const client = await createWriteClientForAction<CreateLiveClipResult>(
    "클립 생성 Admin Client 생성 실패",
    APP_MESSAGE_CODE.error.clip.createFailed,
  );

  if (!client.success) {
    return client.result;
  }

  const { data, error } = await client.supabase.rpc("create_live_clip", {
    p_actor_user_id: actor.userId,
    p_creator_id: creatorId,
    p_title: title,
    p_duration_seconds: durationSeconds,
    p_crop_x_fraction: cropXFraction,
    p_end_offset_seconds: endOffsetSeconds,
  });

  if (error) {
    if (!isKnownClipRpcError(error)) {
      console.error("클립 생성 RPC 실패", error);
    }

    return {
      success: false,
      code: resolveClipRpcErrorCode(error),
    };
  }

  const result = normalizeCreateLiveClipResult(data);

  if (!result) {
    console.error("클립 생성 RPC 응답 형식 오류", data);
    return { success: false, code: APP_MESSAGE_CODE.error.clip.createFailed };
  }

  return { success: true, data: result };
}

// 디테일 진입 시 조회수 증가 — 뷰어별 1회만 카운트(서버 dedup, 새로고침·반복 호출 어뷰징 방지).
// 실패해도 시청을 막지 않는 fire-and-forget이다.
export async function incrementLiveClipViewCountAction(clipId: string): Promise<void> {
  if (!clipId || !isUuid(clipId)) return;

  const viewerKey = await resolveClipViewerKey();
  if (!viewerKey) return;

  const client = await createWriteClientForAction("클립 조회수 Admin Client 생성 실패");

  if (!client.success) return;

  const { error } = await client.supabase.rpc("increment_live_clip_view_count", {
    p_clip_id: clipId,
    p_viewer_key: viewerKey,
  });

  if (error) {
    console.error("클립 조회수 증가 RPC 실패", error);
  }
}
