"use server";
// 사용자의 방송인 구독 해지 요청을 처리합니다.

import { revalidatePath } from "next/cache";

import { createWriteClientForAction } from "@/actions/common/admin-client-action";
import { getAuthenticatedActorId } from "@/actions/common/authenticated-actor";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type { AppActionResult } from "@/types/common/action";
import { resolveSupabaseErrorCode } from "@/utils/common/app-message";
import { isUuid } from "@/utils/common/uuid";

export async function cancelCreatorSubscriptionAction(
  subscriptionId: string,
): Promise<AppActionResult> {
  if (!subscriptionId || !isUuid(subscriptionId)) {
    return { success: false, code: APP_MESSAGE_CODE.error.user.subscriptionCancelFailed };
  }

  const actor = await getAuthenticatedActorId({
    logLabel: "구독 해지 중 인증 사용자 조회 실패",
  });

  if (!actor.success) {
    return actor.result;
  }

  const client = await createWriteClientForAction(
    "구독 해지 Admin Client 생성 실패",
    APP_MESSAGE_CODE.error.user.subscriptionCancelFailed,
  );

  if (!client.success) {
    return client.result;
  }

  const { data, error } = await client.supabase
    .from("creator_subscription")
    .update({
      status: "canceled",
    })
    .eq("id", subscriptionId)
    .eq("subscriber_id", actor.userId)
    .eq("status", "active")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("구독 해지 실패", error);
    return {
      success: false,
      code: resolveSupabaseErrorCode(error, APP_MESSAGE_CODE.error.user.subscriptionCancelFailed),
    };
  }

  if (!data) {
    return { success: false, code: APP_MESSAGE_CODE.error.user.subscriptionCancelFailed };
  }

  revalidatePath("/user/subscriptions");
  revalidatePath("/channel/subscribers");

  return {
    success: true,
    code: APP_MESSAGE_CODE.success.user.subscriptionCanceled,
  };
}
