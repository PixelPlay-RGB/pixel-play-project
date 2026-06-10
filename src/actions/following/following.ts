"use server";
// 크리에이터 팔로잉 상태를 변경하는 서버 액션입니다.

import { getAuthenticatedActorId } from "@/actions/common/authenticated-actor";
import { createWriteClientForAction } from "@/actions/common/admin-client-action";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type { AppMessageCode } from "@/constants/common/app-message-code";
import type { AppActionResult } from "@/types/common/action";
import { resolveSupabaseErrorCode } from "@/utils/common/app-message";
import { isUuid } from "@/utils/common/uuid";

interface ToggleCreatorFollowingActionInput {
  creatorId: string;
}

function createFollowingFailureResult(
  error: unknown,
  fallbackCode: AppMessageCode,
  logLabel: string,
): AppActionResult {
  console.error(logLabel, error);

  return {
    success: false,
    code: resolveSupabaseErrorCode(error, fallbackCode),
  };
}

export async function followCreatorAction({
  creatorId,
}: ToggleCreatorFollowingActionInput): Promise<AppActionResult> {
  if (!creatorId || !isUuid(creatorId)) {
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.following.failed,
    };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "크리에이터 팔로잉 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return actor.result;
  }

  const client = await createWriteClientForAction(
    "크리에이터 팔로우 Admin Client 생성 실패",
    APP_MESSAGE_CODE.error.following.failed,
  );

  if (!client.success) {
    return client.result;
  }

  const { error } = await client.supabase.rpc("follow_creator", {
    p_actor_user_id: actor.userId,
    p_creator_id: creatorId,
  });

  if (error) {
    return createFollowingFailureResult(
      error,
      APP_MESSAGE_CODE.error.following.failed,
      "크리에이터 팔로잉 RPC 실패",
    );
  }

  return {
    success: true,
    code: APP_MESSAGE_CODE.success.following.followed,
  };
}

export async function unfollowCreatorAction({
  creatorId,
}: ToggleCreatorFollowingActionInput): Promise<AppActionResult> {
  if (!creatorId || !isUuid(creatorId)) {
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.following.unfollowFailed,
    };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "크리에이터 팔로잉 해제 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return actor.result;
  }

  const client = await createWriteClientForAction(
    "크리에이터 팔로우 취소 Admin Client 생성 실패",
    APP_MESSAGE_CODE.error.following.unfollowFailed,
  );

  if (!client.success) {
    return client.result;
  }

  const { error } = await client.supabase.rpc("unfollow_creator", {
    p_actor_user_id: actor.userId,
    p_creator_id: creatorId,
  });

  if (error) {
    return createFollowingFailureResult(
      error,
      APP_MESSAGE_CODE.error.following.unfollowFailed,
      "크리에이터 팔로잉 해제 RPC 실패",
    );
  }

  return {
    success: true,
    code: APP_MESSAGE_CODE.success.following.unfollowed,
  };
}
