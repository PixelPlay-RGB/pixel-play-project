// 공개 채널 프로필 서버 조회 로직입니다. (채널 셸 layout에서 사용)
import "server-only";

import { cache } from "react";

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import type { AppActionResult } from "@/types/common/action";
import type { GenericTables } from "@/types/common/supabase.types";
import type { ChannelProfile } from "@/types/channel/channel";
import { resolveViewerId } from "@/utils/auth/viewer";
import { parseChannelProfile } from "@/utils/channel/channel-parser";
import {
  createChannelProfileSubscriptionSnapshot,
  type ChannelProfileSubscriptionRow,
} from "@/utils/channel/channel-profile-subscription";
import { mapChannelEmojiRows, type ChannelEmojiPreviewRow } from "@/utils/channel/channel-emoji";
import { readChannelSubscriptionBadgeAssetsFromStorage } from "@/utils/channel/channel-subscription-badge-storage";

type CreatorSubscriptionRow = Pick<GenericTables<"creator_subscription">, "status" | "end_at">;
type AdminClient = ReturnType<typeof createAdminClient>;

// 같은 요청 안의 generateMetadata + layout 중복 호출을 dedupe합니다.
export const getChannelProfile = cache(async function getChannelProfile(
  creatorId: string,
): Promise<AppActionResult<ChannelProfile>> {
  const viewerId = await resolveViewerId();
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("get_channel_profile", {
    p_creator_id: creatorId,
    p_viewer_id: viewerId ?? undefined,
  });

  if (error) {
    console.error("채널 프로필 조회 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.community.loadFailed };
  }

  const parsed = parseChannelProfile(data, viewerId);

  if (!parsed) {
    return { success: false, code: APP_MESSAGE_CODE.error.common.notFoundPage };
  }

  const subscriptionResult = await readChannelProfileSubscription(supabase, parsed.id, viewerId);

  if (!subscriptionResult.success) {
    return {
      success: false,
      code: subscriptionResult.code ?? APP_MESSAGE_CODE.error.channel.subscriptionLoadFailed,
    };
  }

  if (!subscriptionResult.data) {
    return { success: false, code: APP_MESSAGE_CODE.error.channel.subscriptionLoadFailed };
  }

  return { success: true, data: { ...parsed, subscription: subscriptionResult.data } };
});

async function readChannelProfileSubscription(
  supabase: AdminClient,
  creatorId: string,
  viewerId: string | null,
): Promise<AppActionResult<ChannelProfile["subscription"]>> {
  const [subscriptionResult, badgeAssets, emojis] = await Promise.all([
    viewerId && viewerId !== creatorId
      ? readViewerSubscription(supabase, creatorId, viewerId)
      : Promise.resolve({
          success: true,
          data: null,
        } satisfies AppActionResult<CreatorSubscriptionRow | null>),
    readChannelSubscriptionBadgeAssetsFromStorage(supabase, creatorId),
    readChannelSubscriptionEmojis(supabase, creatorId),
  ]);

  if (!subscriptionResult.success) {
    return {
      success: false,
      code: subscriptionResult.code ?? APP_MESSAGE_CODE.error.channel.subscriptionLoadFailed,
    };
  }

  return {
    success: true,
    data: createChannelProfileSubscriptionSnapshot({
      creatorId,
      subscription: subscriptionResult.data ?? null,
      badgeAssets,
      emojis,
    }),
  };
}

async function readViewerSubscription(
  supabase: AdminClient,
  creatorId: string,
  viewerId: string,
): Promise<AppActionResult<ChannelProfileSubscriptionRow | null>> {
  const { data, error } = await supabase
    .from("creator_subscription")
    .select("status, end_at")
    .eq("creator_id", creatorId)
    .eq("subscriber_id", viewerId)
    .maybeSingle();

  if (error) {
    console.error("채널 프로필 구독 상태 조회 실패", error);
    return { success: false, code: APP_MESSAGE_CODE.error.channel.subscriptionLoadFailed };
  }

  return { success: true, data: data ?? null };
}

async function readChannelSubscriptionEmojis(supabase: AdminClient, creatorId: string) {
  const { data, error } = await supabase
    .from("channel_emoji")
    .select("id, image_path, name, sort_order")
    .eq("creator_id", creatorId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("채널 프로필 구독 이모티콘 목록 조회 실패", error);
    return [];
  }

  return mapChannelEmojiRows((data ?? []) as ChannelEmojiPreviewRow[]);
}
