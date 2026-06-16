"use server";
// 채널 구독 시그니처 이모티콘 이미지를 user-media Storage에 저장합니다.

import { revalidatePath } from "next/cache";

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { USER_MEDIA_BUCKET } from "@/constants/common/storage";
import { createClient } from "@/lib/supabase/server";
import type { AppActionResult } from "@/types/common/action";
import { isAuthSessionMissingError } from "@/utils/auth/auth-error";
import {
  CHANNEL_SUBSCRIPTION_EMOTE_LIMIT,
  buildChannelSubscriptionEmoteStoragePath,
  isChannelSubscriptionEmoteStorageFileName,
  isPlusChannelSubscriptionEmoteStorageFileName,
  isValidChannelSubscriptionEmoteFile,
  normalizeChannelSubscriptionEmoteTitle,
  readChannelSubscriptionEmoteExtension,
  readChannelSubscriptionEmoteTier,
} from "@/utils/channel/channel-subscription-emote-upload";

interface SubscriptionEmoteActionData {
  title: string;
  updatedAt: number;
}

async function getActorId(): Promise<
  | { success: true; supabase: Awaited<ReturnType<typeof createClient>>; userId: string }
  | { success: false; result: AppActionResult<SubscriptionEmoteActionData> }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user || error) {
    if (error && !isAuthSessionMissingError(error)) {
      console.error("구독 이모티콘 업로드 중 인증 유저 조회 실패", error);
    }
    return {
      success: false,
      result: { success: false, code: APP_MESSAGE_CODE.error.auth.authInfoNotFound },
    };
  }

  return { success: true, supabase, userId: user.id };
}

export async function uploadChannelSubscriptionEmoteAction(
  formData: FormData,
): Promise<AppActionResult<SubscriptionEmoteActionData>> {
  const tier = readChannelSubscriptionEmoteTier(formData.get("tier"));
  const titleValue = formData.get("title");
  const title =
    typeof titleValue === "string" ? normalizeChannelSubscriptionEmoteTitle(titleValue) : null;
  const pcFile = formData.get("pcFile");
  const mobileFile = formData.get("mobileFile");

  if (!tier || !title) {
    return { success: false, code: APP_MESSAGE_CODE.error.channel.subscriptionEmoteTitleInvalid };
  }

  if (
    !(pcFile instanceof File) ||
    !(mobileFile instanceof File) ||
    !isValidChannelSubscriptionEmoteFile(pcFile) ||
    !isValidChannelSubscriptionEmoteFile(mobileFile)
  ) {
    return { success: false, code: APP_MESSAGE_CODE.error.channel.subscriptionEmoteImageInvalid };
  }

  const pcExtension = readChannelSubscriptionEmoteExtension(pcFile);
  const mobileExtension = readChannelSubscriptionEmoteExtension(mobileFile);
  if (!pcExtension || !mobileExtension) {
    return { success: false, code: APP_MESSAGE_CODE.error.channel.subscriptionEmoteImageInvalid };
  }

  const actor = await getActorId();
  if (!actor.success) {
    return actor.result;
  }

  const { data: existingFiles, error: listError } = await actor.supabase.storage
    .from(USER_MEDIA_BUCKET)
    .list(`${actor.userId}/emoticon`, {
      limit: 100,
      sortBy: { column: "name", order: "asc" },
    });

  if (listError) {
    console.error("구독 이모티콘 목록 조회 실패", listError);
    return { success: false, code: APP_MESSAGE_CODE.error.channel.subscriptionEmoteSaveFailed };
  }

  const fileBaseName = `${tier === "plus" ? "plus-" : ""}${title}`;
  const tierFileCount = (existingFiles ?? []).filter((file) => {
    if (!isChannelSubscriptionEmoteStorageFileName(file.name)) return false;
    const isPlus = isPlusChannelSubscriptionEmoteStorageFileName(file.name);

    return tier === "plus" ? isPlus : !isPlus;
  }).length;
  const isUpdatingExisting = (existingFiles ?? []).some(
    (file) => file.name.replace(/\.(?:gif|jpe?g|png|webp)$/i, "") === fileBaseName,
  );

  if (!isUpdatingExisting && tierFileCount >= CHANNEL_SUBSCRIPTION_EMOTE_LIMIT) {
    return { success: false, code: APP_MESSAGE_CODE.error.channel.subscriptionEmoteLimitReached };
  }

  const pcPath = buildChannelSubscriptionEmoteStoragePath({
    creatorId: actor.userId,
    title,
    tier,
    extension: pcExtension,
    target: "pc",
  });
  const mobilePath = buildChannelSubscriptionEmoteStoragePath({
    creatorId: actor.userId,
    title,
    tier,
    extension: mobileExtension,
    target: "mobile",
  });

  const { error: pcUploadError } = await actor.supabase.storage
    .from(USER_MEDIA_BUCKET)
    .upload(pcPath, pcFile, {
      cacheControl: "3600",
      contentType: pcFile.type,
      upsert: true,
    });

  if (pcUploadError) {
    console.error("구독 이모티콘 PC 이미지 업로드 실패", pcUploadError);
    return { success: false, code: APP_MESSAGE_CODE.error.channel.subscriptionEmoteSaveFailed };
  }

  const { error: mobileUploadError } = await actor.supabase.storage
    .from(USER_MEDIA_BUCKET)
    .upload(mobilePath, mobileFile, {
      cacheControl: "3600",
      contentType: mobileFile.type,
      upsert: true,
    });

  if (mobileUploadError) {
    console.error("구독 이모티콘 모바일 이미지 업로드 실패", mobileUploadError);
    return { success: false, code: APP_MESSAGE_CODE.error.channel.subscriptionEmoteSaveFailed };
  }

  revalidatePath("/channel/subscribers");

  return {
    success: true,
    code: APP_MESSAGE_CODE.success.channel.subscriptionEmoteSaved,
    data: { title, updatedAt: Date.now() },
  };
}
