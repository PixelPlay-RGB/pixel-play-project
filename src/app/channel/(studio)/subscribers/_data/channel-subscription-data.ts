// 채널 구독자 관리 페이지에서 사용할 구독자 스냅샷을 조회합니다.
import "server-only";

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { USER_MEDIA_BUCKET } from "@/constants/common/storage";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createClient } from "@/lib/supabase/server";
import type { AppActionResult } from "@/types/common/action";
import type { GenericTables } from "@/types/common/supabase.types";
import {
  buildChannelSubscriptionSnapshot,
  type ChannelSubscriberItem,
  type ChannelSubscriptionSnapshot,
} from "@/utils/channel/channel-subscription";
import {
  isChannelSubscriptionEmoteStorageFileName,
  isPlusChannelSubscriptionEmoteStorageFileName,
} from "@/utils/channel/channel-subscription-emote-upload";
import { isAuthSessionMissingError } from "@/utils/auth/auth-error";
import { LIVE_SUBSCRIPTION_BADGE_MIN_CUSTOM_MONTH } from "@/utils/live/live-subscription-badge";

type CreatorSubscriptionRow = Pick<
  GenericTables<"creator_subscription">,
  "id" | "subscriber_id" | "started_at" | "end_at" | "total_months" | "status"
>;

type SubscriberProfileRow = Pick<GenericTables<"user">, "id" | "nickname">;

const UNKNOWN_SUBSCRIBER_NICKNAME = "알 수 없음";

function readCustomBadgeMonths(files: { name: string }[] | null) {
  return (files ?? [])
    .map((file) => Number(file.name.replace(/\.png$/i, "")))
    .filter(
      (month) =>
        Number.isInteger(month) &&
        month >= LIVE_SUBSCRIPTION_BADGE_MIN_CUSTOM_MONTH &&
        month <= 120,
    )
    .sort((a, b) => a - b);
}

function readSubscriptionEmoteCounts(files: { name: string }[] | null) {
  return (files ?? []).reduce(
    (counts, file) => {
      if (!isChannelSubscriptionEmoteStorageFileName(file.name)) {
        return counts;
      }

      if (isPlusChannelSubscriptionEmoteStorageFileName(file.name)) {
        counts.plus += 1;
      } else {
        counts.common += 1;
      }

      return counts;
    },
    { common: 0, plus: 0 },
  );
}

export async function getChannelSubscriptionSnapshot(): Promise<
  AppActionResult<ChannelSubscriptionSnapshot>
> {
  const serverClient = await createClient();
  const {
    data: { user },
    error: userError,
  } = await serverClient.auth.getUser();

  if (userError && !isAuthSessionMissingError(userError)) {
    console.error("채널 구독자 조회 중 인증 유저 조회 실패", userError);
  }

  if (!user) {
    return { success: false, code: APP_MESSAGE_CODE.error.auth.authInfoNotFound };
  }

  const supabase = createAdminClient();
  const { data: subscriptions, error: subscriptionError } = await supabase
    .from("creator_subscription")
    .select("id, subscriber_id, started_at, end_at, total_months, status")
    .eq("creator_id", user.id)
    .order("started_at", { ascending: false });

  if (subscriptionError) {
    console.error("채널 구독자 구독 내역 조회 실패", subscriptionError);
    return { success: false, code: APP_MESSAGE_CODE.error.channel.subscriptionLoadFailed };
  }

  const subscriptionRows = (subscriptions ?? []) as CreatorSubscriptionRow[];
  const { data: badgeFiles, error: badgeListError } = await supabase.storage
    .from(USER_MEDIA_BUCKET)
    .list(`${user.id}/subscription`, {
      limit: 120,
      sortBy: { column: "name", order: "asc" },
    });

  if (badgeListError) {
    console.error("구독 배지 목록 조회 실패", badgeListError);
  }

  const { data: emoteFiles, error: emoteListError } = await supabase.storage
    .from(USER_MEDIA_BUCKET)
    .list(`${user.id}/emoticon`, {
      limit: 100,
      sortBy: { column: "name", order: "asc" },
    });

  if (emoteListError) {
    console.error("구독 이모티콘 목록 조회 실패", emoteListError);
  }

  const customBadgeMonths = readCustomBadgeMonths(badgeFiles ?? null);
  const emoteCounts = readSubscriptionEmoteCounts(emoteFiles ?? null);
  const subscriberIds = Array.from(new Set(subscriptionRows.map((row) => row.subscriber_id)));

  if (subscriberIds.length === 0) {
    return {
      success: true,
      data: buildChannelSubscriptionSnapshot([], new Date(), {
        creatorId: user.id,
        customBadgeMonths,
        subscriptionEmoteCommonCount: emoteCounts.common,
        subscriptionEmotePlusCount: emoteCounts.plus,
      }),
    };
  }

  const { data: profiles, error: profileError } = await supabase
    .from("user")
    .select("id, nickname")
    .in("id", subscriberIds);

  if (profileError) {
    console.error("채널 구독자 프로필 조회 실패", profileError);
    return { success: false, code: APP_MESSAGE_CODE.error.channel.subscriptionLoadFailed };
  }

  const nicknameById = new Map(
    ((profiles ?? []) as SubscriberProfileRow[]).map((profile) => [profile.id, profile.nickname]),
  );

  const items: ChannelSubscriberItem[] = subscriptionRows.map((subscription) => ({
    id: subscription.id,
    subscriberId: subscription.subscriber_id,
    nickname: nicknameById.get(subscription.subscriber_id) ?? UNKNOWN_SUBSCRIBER_NICKNAME,
    startedAt: subscription.started_at,
    endAt: subscription.end_at,
    totalMonths: subscription.total_months,
    status: subscription.status,
  }));

  return {
    success: true,
    data: buildChannelSubscriptionSnapshot(items, new Date(), {
      creatorId: user.id,
      customBadgeMonths,
      subscriptionEmoteCommonCount: emoteCounts.common,
      subscriptionEmotePlusCount: emoteCounts.plus,
    }),
  };
}
