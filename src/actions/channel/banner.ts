"use server";
// 채널 배너 CRUD. 이미지 업로드는 user-context client(storage RLS), 행 메타데이터는 admin RPC.

import { getAuthenticatedActorId } from "@/actions/common/authenticated-actor";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createClient } from "@/lib/supabase/server";
import { channelBannerInputSchema } from "@/lib/zod/channel-profile";
import type { ChannelBanner } from "@/types/channel/channel";
import type { AppActionResult } from "@/types/common/action";
import type { Json } from "@/types/database.types";
import { isAuthSessionMissingError } from "@/utils/auth/auth-error";
import { parseChannelBanners } from "@/utils/channel/channel-parser";

const BANNER_BUCKET = "channel-media";
const MAX_BANNER_SIZE = 1 * 1024 * 1024; // 1MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"];

// storage 객체 이름을 배너 제목 기반으로 생성(UUID 대신). 충돌 방지를 위해 짧은 접미사만 덧붙인다.
// 한글 제목은 그대로 유지하고, 경로/특수문자만 제거한다(공개 URL은 세그먼트 인코딩으로 처리).
function buildBannerObjectName(title: string, fileName: string): string {
  const ext = (fileName.split(".").pop() ?? "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const base =
    title
      .trim()
      .replace(/[\\/]+/g, " ")
      .replace(/\s+/g, "-")
      .replace(/[^\p{L}\p{N}_-]/gu, "")
      .replace(/-+/g, "-")
      .replace(/^[-_]+|[-_]+$/g, "")
      .slice(0, 40) || "banner";
  return `${base}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
}

export async function addChannelBannerAction(
  formData: FormData,
): Promise<AppActionResult<ChannelBanner[]>> {
  const file = formData.get("file") as File | null;
  const parsed = channelBannerInputSchema.safeParse({
    title: (formData.get("title") as string | null) ?? "",
    linkUrl: (formData.get("linkUrl") as string | null) ?? "",
  });

  if (!parsed.success || !file || file.size === 0 || !ALLOWED_TYPES.includes(file.type)) {
    return { success: false, code: APP_MESSAGE_CODE.error.channel.bannerSaveFailed };
  }
  if (file.size > MAX_BANNER_SIZE) {
    return { success: false, code: APP_MESSAGE_CODE.error.channel.bannerImageTooLarge };
  }

  // 1) user-context client로 storage 업로드 (RLS: banners/{auth.uid}/...)
  const userClient = await createClient();
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (!user || userError) {
    if (userError && !isAuthSessionMissingError(userError)) {
      console.error("배너 업로드 인증 유저 조회 실패", userError);
    }
    return { success: false, code: APP_MESSAGE_CODE.error.auth.authInfoNotFound };
  }

  const imagePath = `banners/${user.id}/${buildBannerObjectName(parsed.data.title, file.name)}`;
  const { error: uploadError } = await userClient.storage
    .from(BANNER_BUCKET)
    .upload(imagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("배너 이미지 업로드 실패", uploadError);
    return { success: false, code: APP_MESSAGE_CODE.error.channel.bannerSaveFailed };
  }

  // 2) admin RPC로 행 insert(개수 제한·순서). 실패 시 방금 올린 객체 정리.
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("insert_channel_banner", {
    p_actor_user_id: user.id,
    p_image_path: imagePath,
    p_title: parsed.data.title,
    p_link_url: parsed.data.linkUrl,
  });

  if (error) {
    await userClient.storage.from(BANNER_BUCKET).remove([imagePath]);
    const code =
      (error as { code?: string }).code === "PX409"
        ? APP_MESSAGE_CODE.error.channel.bannerLimitReached
        : APP_MESSAGE_CODE.error.channel.bannerSaveFailed;
    return { success: false, code };
  }

  return {
    success: true,
    data: parseChannelBanners(data),
    code: APP_MESSAGE_CODE.success.channel.bannerSaved,
  };
}

export async function deleteChannelBannerAction(
  bannerId: string,
): Promise<AppActionResult<ChannelBanner[]>> {
  const actor = await getAuthenticatedActorId({
    logLabel: "배너 삭제 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("delete_channel_banner", {
    p_actor_user_id: actor.userId,
    p_banner_id: bannerId,
  });

  if (error || !data) {
    console.error("배너 삭제 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.channel.bannerDeleteFailed };
  }

  const payload = data as unknown as { imagePath?: string; banners?: Json };

  // storage 객체 정리(best-effort).
  if (payload.imagePath) {
    const userClient = await createClient();
    await userClient.storage.from(BANNER_BUCKET).remove([payload.imagePath]);
  }

  return {
    success: true,
    data: parseChannelBanners(payload.banners ?? null),
    code: APP_MESSAGE_CODE.success.channel.bannerDeleted,
  };
}

export async function reorderChannelBannersAction(
  bannerIds: string[],
): Promise<AppActionResult<ChannelBanner[]>> {
  const actor = await getAuthenticatedActorId({
    logLabel: "배너 순서 변경 중 인증 유저 조회 실패",
  });

  if (!actor.success) {
    return { success: false, code: actor.result.code };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("reorder_channel_banners", {
    p_actor_user_id: actor.userId,
    p_banner_ids: bannerIds,
  });

  if (error) {
    console.error("배너 순서 변경 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.channel.bannerSaveFailed };
  }

  return { success: true, data: parseChannelBanners(data) };
}
