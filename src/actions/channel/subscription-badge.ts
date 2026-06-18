"use server";
// 채널 구독 배지 이미지를 user-media Storage에 업로드하거나 삭제합니다.

import { revalidatePath } from "next/cache";

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { USER_MEDIA_BUCKET } from "@/constants/common/storage";
import { createClient } from "@/lib/supabase/server";
import type { AppActionResult } from "@/types/common/action";
import {
  CHANNEL_SUBSCRIPTION_BADGE_MAX_FILE_SIZE,
  isValidSubscriptionBadgePng,
} from "@/utils/channel/channel-subscription-badge-upload";
import { isAuthSessionMissingError } from "@/utils/auth/auth-error";
import {
  LIVE_SUBSCRIPTION_BADGE_VERSION_FILE,
  getLiveSubscriptionBadgeStoragePathByMonth,
  isValidLiveSubscriptionBadgeMonth,
} from "@/utils/live/live-subscription-badge";

interface SubscriptionBadgeActionData {
  month: number;
  updatedAt: number;
}

function readMonth(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;

  const month = Number(value);

  return isValidLiveSubscriptionBadgeMonth(month) ? month : null;
}

async function getActorId(
  logLabel: string,
): Promise<
  | { success: true; supabase: Awaited<ReturnType<typeof createClient>>; userId: string }
  | { success: false; result: AppActionResult<SubscriptionBadgeActionData> }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user || error) {
    if (error && !isAuthSessionMissingError(error)) {
      console.error(logLabel, error);
    }
    return {
      success: false,
      result: { success: false, code: APP_MESSAGE_CODE.error.auth.authInfoNotFound },
    };
  }

  return { success: true, supabase, userId: user.id };
}

async function touchSubscriptionBadgeVersion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const versionPath = `${userId}/subscription/${LIVE_SUBSCRIPTION_BADGE_VERSION_FILE}`;
  const body = new Blob([new Date().toISOString()], { type: "text/plain" });
  const { error } = await supabase.storage.from(USER_MEDIA_BUCKET).upload(versionPath, body, {
    cacheControl: "0",
    contentType: "text/plain",
    upsert: true,
  });

  if (error) {
    console.error("구독 배지 버전 갱신 실패", error);
  }
}

export async function uploadChannelSubscriptionBadgeAction(
  formData: FormData,
): Promise<AppActionResult<SubscriptionBadgeActionData>> {
  const month = readMonth(formData.get("month"));
  const file = formData.get("file");

  if (!month || !(file instanceof File) || file.size === 0 || file.type !== "image/png") {
    return { success: false, code: APP_MESSAGE_CODE.error.channel.subscriptionBadgeImageInvalid };
  }

  if (file.size > CHANNEL_SUBSCRIPTION_BADGE_MAX_FILE_SIZE) {
    return { success: false, code: APP_MESSAGE_CODE.error.channel.subscriptionBadgeImageTooLarge };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isValidSubscriptionBadgePng(bytes)) {
    return { success: false, code: APP_MESSAGE_CODE.error.channel.subscriptionBadgeImageInvalid };
  }

  const actor = await getActorId("구독 배지 업로드 중 인증 유저 조회 실패");
  if (!actor.success) {
    return actor.result;
  }

  const path = getLiveSubscriptionBadgeStoragePathByMonth(actor.userId, month);
  const { error } = await actor.supabase.storage.from(USER_MEDIA_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: "image/png",
    upsert: true,
  });

  if (error) {
    console.error("구독 배지 업로드 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.channel.subscriptionBadgeSaveFailed };
  }

  await touchSubscriptionBadgeVersion(actor.supabase, actor.userId);

  revalidatePath("/channel/subscribers");

  return {
    success: true,
    code: APP_MESSAGE_CODE.success.channel.subscriptionBadgeSaved,
    data: { month, updatedAt: Date.now() },
  };
}

export async function deleteChannelSubscriptionBadgeAction(
  month: number,
): Promise<AppActionResult<SubscriptionBadgeActionData>> {
  if (!isValidLiveSubscriptionBadgeMonth(month)) {
    return { success: false, code: APP_MESSAGE_CODE.error.channel.subscriptionBadgeDeleteFailed };
  }

  const actor = await getActorId("구독 배지 삭제 중 인증 유저 조회 실패");
  if (!actor.success) {
    return actor.result;
  }

  const path = getLiveSubscriptionBadgeStoragePathByMonth(actor.userId, month);
  const { error } = await actor.supabase.storage.from(USER_MEDIA_BUCKET).remove([path]);

  if (error) {
    console.error("구독 배지 삭제 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.channel.subscriptionBadgeDeleteFailed };
  }

  await touchSubscriptionBadgeVersion(actor.supabase, actor.userId);

  revalidatePath("/channel/subscribers");

  return {
    success: true,
    code: APP_MESSAGE_CODE.success.channel.subscriptionBadgeDeleted,
    data: { month, updatedAt: Date.now() },
  };
}
