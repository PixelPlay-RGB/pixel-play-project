"use server";
// 채널 이모지(구독티콘) CRUD. 이미지 업로드는 user-context client(storage RLS), 행은 admin RPC(배너 패턴).

import { getAuthenticatedActorId } from "@/actions/common/authenticated-actor";
import {
  CHANNEL_EMOJI_ALLOWED_TYPES,
  CHANNEL_EMOJI_MAX_SIZE,
  CHANNEL_EMOJI_NAME_MAX,
} from "@/constants/channel/channel-emoji";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { USER_MEDIA_BUCKET } from "@/constants/common/storage";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createClient } from "@/lib/supabase/server";
import type { ChannelEmoji } from "@/types/channel/channel-emoji";
import type { AppActionResult } from "@/types/common/action";
import type { Json } from "@/types/database.types";
import { isAuthSessionMissingError } from "@/utils/auth/auth-error";
import { buildEmojiObjectName, parseChannelEmojis } from "@/utils/channel/channel-emoji";

// insert_channel_emoji RPC가 개수 한도(10개) 초과 시 던지는 SQLSTATE.
const EMOJI_LIMIT_REACHED_PG_CODE = "PX409";

function readPayload(data: Json | null): Record<string, Json | undefined> | null {
  return data && typeof data === "object" && !Array.isArray(data)
    ? (data as Record<string, Json | undefined>)
    : null;
}

export async function addChannelEmojiAction(
  formData: FormData,
): Promise<AppActionResult<ChannelEmoji[]>> {
  const file = formData.get("file") as File | null;
  const name = ((formData.get("name") as string | null) ?? "").trim();

  if (!file || file.size === 0 || name.length === 0 || name.length > CHANNEL_EMOJI_NAME_MAX) {
    return { success: false, code: APP_MESSAGE_CODE.error.channel.emojiSaveFailed };
  }
  if (!CHANNEL_EMOJI_ALLOWED_TYPES.includes(file.type)) {
    return { success: false, code: APP_MESSAGE_CODE.error.channel.emojiInvalidType };
  }
  if (file.size > CHANNEL_EMOJI_MAX_SIZE) {
    return { success: false, code: APP_MESSAGE_CODE.error.channel.emojiImageTooLarge };
  }

  const userClient = await createClient();
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (!user || userError) {
    if (userError && !isAuthSessionMissingError(userError)) {
      console.error("이모지 업로드 인증 유저 조회 실패", userError);
    }
    return { success: false, code: APP_MESSAGE_CODE.error.auth.authInfoNotFound };
  }

  const imagePath = `${user.id}/emoji/${buildEmojiObjectName(file.type)}`;
  const { error: uploadError } = await userClient.storage
    .from(USER_MEDIA_BUCKET)
    .upload(imagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("이모지 이미지 업로드 실패", uploadError);
    return { success: false, code: APP_MESSAGE_CODE.error.channel.emojiSaveFailed };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("insert_channel_emoji", {
    p_actor_user_id: user.id,
    p_image_path: imagePath,
    p_name: name,
  });

  if (error) {
    await userClient.storage.from(USER_MEDIA_BUCKET).remove([imagePath]);
    const code =
      (error as { code?: string }).code === EMOJI_LIMIT_REACHED_PG_CODE
        ? APP_MESSAGE_CODE.error.channel.emojiLimitReached
        : APP_MESSAGE_CODE.error.channel.emojiSaveFailed;
    return { success: false, code };
  }

  return {
    success: true,
    data: parseChannelEmojis(data),
    code: APP_MESSAGE_CODE.success.channel.emojiSaved,
  };
}

export async function updateChannelEmojiAction(
  formData: FormData,
): Promise<AppActionResult<ChannelEmoji[]>> {
  const emojiId = (formData.get("emojiId") as string | null) ?? "";
  const name = ((formData.get("name") as string | null) ?? "").trim();
  const file = formData.get("file") as File | null;
  const hasNewImage = !!file && file.size > 0;

  if (!emojiId || name.length === 0 || name.length > CHANNEL_EMOJI_NAME_MAX) {
    return { success: false, code: APP_MESSAGE_CODE.error.channel.emojiSaveFailed };
  }
  if (hasNewImage && !CHANNEL_EMOJI_ALLOWED_TYPES.includes(file.type)) {
    return { success: false, code: APP_MESSAGE_CODE.error.channel.emojiInvalidType };
  }
  if (hasNewImage && file.size > CHANNEL_EMOJI_MAX_SIZE) {
    return { success: false, code: APP_MESSAGE_CODE.error.channel.emojiImageTooLarge };
  }

  const userClient = await createClient();
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (!user || userError) {
    if (userError && !isAuthSessionMissingError(userError)) {
      console.error("이모지 수정 인증 유저 조회 실패", userError);
    }
    return { success: false, code: APP_MESSAGE_CODE.error.auth.authInfoNotFound };
  }

  // 새 이미지가 있으면 먼저 업로드한 뒤 경로를 RPC로 넘긴다(옛 경로는 RPC가 반환해 아래에서 정리).
  let newImagePath: string | null = null;
  if (hasNewImage) {
    newImagePath = `${user.id}/emoji/${buildEmojiObjectName(file.type)}`;
    const { error: uploadError } = await userClient.storage
      .from(USER_MEDIA_BUCKET)
      .upload(newImagePath, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      console.error("이모지 이미지 업로드 실패", uploadError);
      return { success: false, code: APP_MESSAGE_CODE.error.channel.emojiSaveFailed };
    }
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("update_channel_emoji", {
    p_actor_user_id: user.id,
    p_emoji_id: emojiId,
    p_name: name,
    p_image_path: newImagePath ?? undefined,
  });

  if (error || !data) {
    if (newImagePath) {
      await userClient.storage.from(USER_MEDIA_BUCKET).remove([newImagePath]);
    }
    console.error("이모지 수정 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.channel.emojiSaveFailed };
  }

  // RPC는 { oldImagePath, emojis }를 반환한다. 이미지 교체 시 옛 객체를 정리(best-effort).
  const payload = readPayload(data);
  const oldImagePath = typeof payload?.oldImagePath === "string" ? payload.oldImagePath : null;
  if (oldImagePath) {
    const { error: removeError } = await userClient.storage
      .from(USER_MEDIA_BUCKET)
      .remove([oldImagePath]);
    if (removeError) {
      console.error("이모지 옛 이미지 정리 실패", removeError);
    }
  }

  return {
    success: true,
    data: parseChannelEmojis(payload?.emojis ?? null),
    code: APP_MESSAGE_CODE.success.channel.emojiUpdated,
  };
}

export async function deleteChannelEmojiAction(
  emojiId: string,
): Promise<AppActionResult<ChannelEmoji[]>> {
  const actor = await getAuthenticatedActorId({ logLabel: "이모지 삭제 중 인증 유저 조회 실패" });
  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("delete_channel_emoji", {
    p_actor_user_id: actor.userId,
    p_emoji_id: emojiId,
  });

  if (error || !data) {
    console.error("이모지 삭제 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.channel.emojiDeleteFailed };
  }

  const payload = readPayload(data);
  const imagePath = typeof payload?.imagePath === "string" ? payload.imagePath : null;
  if (imagePath) {
    const userClient = await createClient();
    const { error: removeError } = await userClient.storage
      .from(USER_MEDIA_BUCKET)
      .remove([imagePath]);
    if (removeError) {
      console.error("이모지 storage 정리 실패", removeError);
    }
  }

  return {
    success: true,
    data: parseChannelEmojis(payload?.emojis ?? null),
    code: APP_MESSAGE_CODE.success.channel.emojiDeleted,
  };
}

export async function reorderChannelEmojisAction(
  emojiIds: string[],
): Promise<AppActionResult<ChannelEmoji[]>> {
  const actor = await getAuthenticatedActorId({
    logLabel: "이모지 순서 변경 중 인증 유저 조회 실패",
  });
  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("reorder_channel_emojis", {
    p_actor_user_id: actor.userId,
    p_emoji_ids: emojiIds,
  });

  if (error) {
    console.error("이모지 순서 변경 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.channel.emojiSaveFailed };
  }

  return { success: true, data: parseChannelEmojis(data) };
}
