"use server";
// 라이브 클립 생성·조회수 RPC를 호출하는 서버 액션입니다.
// 추출·업로드는 EC2 워커가 비동기로 수행하므로 생성 액션은 pending 행 생성까지만 책임진다.

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createWriteClientForAction } from "@/actions/common/admin-client-action";
import { getAuthenticatedActorId } from "@/actions/common/authenticated-actor";
import {
  CLIP_DURATION_MAX_SECONDS,
  CLIP_DURATION_MIN_SECONDS,
  CLIP_TITLE_MAX_LENGTH,
} from "@/constants/clip/clip";
import type { AppActionResult } from "@/types/common/action";
import { isKnownClipRpcError, resolveClipRpcErrorCode } from "@/utils/common/app-message";
import { isRecord } from "@/utils/common/json";
import { isUuid } from "@/utils/common/uuid";

export interface CreateLiveClipInput {
  // 빈 문자열이면 RPC가 방송 제목으로 폴백한다(입력칸 기본값과 동일 규칙).
  title: string;
  durationSeconds: number;
  cropXFraction: number;
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

  if (!creatorId || !isUuid(creatorId)) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  if (
    title.length > CLIP_TITLE_MAX_LENGTH ||
    durationSeconds < CLIP_DURATION_MIN_SECONDS ||
    durationSeconds > CLIP_DURATION_MAX_SECONDS ||
    !Number.isFinite(cropXFraction) ||
    cropXFraction < 0 ||
    cropXFraction > 1
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

// 디테일 진입 시 단순 증가 — 실패해도 시청을 막지 않는 fire-and-forget이다.
export async function incrementLiveClipViewCountAction(clipId: string): Promise<void> {
  if (!clipId || !isUuid(clipId)) return;

  const client = await createWriteClientForAction("클립 조회수 Admin Client 생성 실패");

  if (!client.success) return;

  const { error } = await client.supabase.rpc("increment_live_clip_view_count", {
    p_clip_id: clipId,
  });

  if (error) {
    console.error("클립 조회수 증가 RPC 실패", error);
  }
}
