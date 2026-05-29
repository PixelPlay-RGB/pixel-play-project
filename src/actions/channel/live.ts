"use server";
// 방송 운영 페이지에서 사용하는 라이브 방송 RPC Server Action입니다.

import { getAuthenticatedActorId } from "@/actions/common/authenticated-actor";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { startLiveBroadcastSchema, type StartLiveBroadcastInput } from "@/lib/zod/channel-live";
import type { AppActionResult } from "@/types/common/action";
import { revalidatePath } from "next/cache";

interface EndLiveBroadcastInput {
  broadcastId: string;
}

export async function startLiveBroadcastAction(
  input: StartLiveBroadcastInput,
): Promise<AppActionResult<{ broadcastId: string }>> {
  const parsed = startLiveBroadcastSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "방송 시작 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const supabase = createAdminClient();
  const { data: broadcastId, error } = await supabase.rpc("start_live_broadcast", {
    p_actor_user_id: actor.userId,
    p_tags: parsed.data.tags,
    p_thumbnail_url: parsed.data.thumbnailUrl ?? null,
    p_title: parsed.data.title,
  });

  if (error || !broadcastId) {
    console.error("방송 시작 RPC 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  revalidatePath("/channel/live");

  return {
    success: true,
    data: { broadcastId },
  };
}

export async function endLiveBroadcastAction({
  broadcastId,
}: EndLiveBroadcastInput): Promise<AppActionResult> {
  if (!broadcastId) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "방송 종료 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return actor.result;
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("end_live_broadcast", {
    p_actor_user_id: actor.userId,
    p_broadcast_id: broadcastId,
  });

  if (error) {
    console.error("방송 종료 RPC 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  revalidatePath("/channel/live");

  return { success: true };
}
