"use server";
// 크리에이터 팔로우 상태를 변경하는 서버 액션입니다.
import { getAuthenticatedActorId } from "@/actions/common/authenticated-actor";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type { AppMessageCode } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import type { AppActionResult } from "@/types/common/action";
import { resolveSupabaseErrorCode } from "@/utils/common/app-message";

interface FollowCreatorActionInput {
  creatorId: string;
}

function createFollowFailureResult(
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
}: FollowCreatorActionInput): Promise<AppActionResult> {
  const actor = await getAuthenticatedActorId({
    logLabel: "크리에이터 팔로우 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return actor.result;
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("follow_creator", {
    p_actor_user_id: actor.userId,
    p_creator_id: creatorId,
  });

  if (error) {
    return createFollowFailureResult(
      error,
      APP_MESSAGE_CODE.error.follow.failed,
      "크리에이터 팔로우 RPC 실패",
    );
  }

  return {
    success: true,
    code: APP_MESSAGE_CODE.success.follow.followed,
  };
}

export async function unfollowCreatorAction({
  creatorId,
}: FollowCreatorActionInput): Promise<AppActionResult> {
  const actor = await getAuthenticatedActorId({
    logLabel: "크리에이터 팔로우 해제 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return actor.result;
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("unfollow_creator", {
    p_actor_user_id: actor.userId,
    p_creator_id: creatorId,
  });

  if (error) {
    return createFollowFailureResult(
      error,
      APP_MESSAGE_CODE.error.follow.unfollowFailed,
      "크리에이터 팔로우 해제 RPC 실패",
    );
  }

  return {
    success: true,
    code: APP_MESSAGE_CODE.success.follow.unfollowed,
  };
}
