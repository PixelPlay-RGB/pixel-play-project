"use server";
// 크리에이터 팔로우·언팔로우 RPC를 호출하는 서버 액션입니다.

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { getAuthenticatedActorId } from "@/actions/common/authenticated-actor";
import { createWriteClientForAction } from "@/actions/common/admin-client-action";
import { isUuid } from "@/utils/common/uuid";
import type { AppActionResult } from "@/types/common/action";

export async function followCreatorAction(creatorId: string): Promise<AppActionResult> {
  if (!creatorId || !isUuid(creatorId)) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "팔로우 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return actor.result;
  }

  const client = await createWriteClientForAction(
    "팔로우 Admin Client 생성 실패",
    APP_MESSAGE_CODE.error.live.followFailed,
  );

  if (!client.success) {
    return client.result;
  }

  const { error } = await client.supabase.rpc("follow_creator", {
    p_actor_user_id: actor.userId,
    p_creator_id: creatorId,
  });

  if (error) {
    console.error("팔로우 RPC 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.live.followFailed };
  }

  return { success: true };
}

export async function unfollowCreatorAction(creatorId: string): Promise<AppActionResult> {
  if (!creatorId || !isUuid(creatorId)) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.unknown };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "언팔로우 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return actor.result;
  }

  const client = await createWriteClientForAction(
    "언팔로우 Admin Client 생성 실패",
    APP_MESSAGE_CODE.error.live.unfollowFailed,
  );

  if (!client.success) {
    return client.result;
  }

  const { error } = await client.supabase.rpc("unfollow_creator", {
    p_actor_user_id: actor.userId,
    p_creator_id: creatorId,
  });

  if (error) {
    console.error("언팔로우 RPC 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.live.unfollowFailed };
  }

  return { success: true };
}
