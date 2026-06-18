// 채널 구독 관리 화면에서 사용할 구독자와 혜택 스냅샷을 조회합니다.
import "server-only";

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createClient } from "@/lib/supabase/server";
import type { AppActionResult } from "@/types/common/action";
import type { GenericTables } from "@/types/common/supabase.types";
import {
  buildChannelSubscriptionSnapshot,
  type ChannelSubscriberItem,
  type ChannelSubscriberSort,
  type ChannelSubscriptionSnapshot,
} from "@/utils/channel/channel-subscription";
import { isAuthSessionMissingError } from "@/utils/auth/auth-error";
import { readChannelSubscriptionBadgeAssetsFromStorage } from "@/utils/channel/channel-subscription-badge-storage";
import { getLiveSubscriptionBadgeSourcesByMonth } from "@/utils/live/live-subscription-badge";

type CreatorSubscriptionRow = Pick<
  GenericTables<"creator_subscription">,
  "id" | "subscriber_id" | "started_at" | "end_at" | "total_months" | "status"
>;

type SubscriberProfileRow = Pick<GenericTables<"user">, "id" | "nickname" | "photo_url">;

const UNKNOWN_SUBSCRIBER_NICKNAME = "알 수 없음";
const CHANNEL_SUBSCRIBER_SORT_VALUES = [
  "started_desc",
  "started_asc",
  "months_desc",
  "months_asc",
  "nickname_asc",
] as const satisfies readonly ChannelSubscriberSort[];

interface ChannelSubscriptionSnapshotOptions {
  query?: string;
  sort?: ChannelSubscriberSort;
}

export async function getChannelSubscriptionSnapshot({
  query = "",
  sort = "started_desc",
}: ChannelSubscriptionSnapshotOptions = {}): Promise<AppActionResult<ChannelSubscriptionSnapshot>> {
  const normalizedQuery = query.trim();
  const normalizedSort = normalizeChannelSubscriberSort(sort);
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
  let subscriptionQuery = supabase
    .from("creator_subscription")
    .select("id, subscriber_id, started_at, end_at, total_months, status")
    .eq("creator_id", user.id);

  if (normalizedSort === "started_asc") {
    subscriptionQuery = subscriptionQuery.order("started_at", { ascending: true });
  } else if (normalizedSort === "months_desc") {
    subscriptionQuery = subscriptionQuery
      .order("total_months", { ascending: false })
      .order("started_at", { ascending: false });
  } else if (normalizedSort === "months_asc") {
    subscriptionQuery = subscriptionQuery
      .order("total_months", { ascending: true })
      .order("started_at", { ascending: false });
  } else if (normalizedSort !== "nickname_asc") {
    subscriptionQuery = subscriptionQuery.order("started_at", { ascending: false });
  }

  const { data: subscriptions, error: subscriptionError } = await subscriptionQuery;

  if (subscriptionError) {
    console.error("채널 구독자 구독 내역 조회 실패", subscriptionError);
    return { success: false, code: APP_MESSAGE_CODE.error.channel.subscriptionLoadFailed };
  }

  const subscriptionRows = (subscriptions ?? []) as CreatorSubscriptionRow[];
  const badgeAssetInfo = await readChannelSubscriptionBadgeAssetsFromStorage(supabase, user.id);
  const subscriptionBadgeImageSources = getLiveSubscriptionBadgeSourcesByMonth(
    user.id,
    badgeAssetInfo,
  );
  const summarySubscribers = subscriptionRows.map((subscription) =>
    createChannelSubscriberItem(subscription, null),
  );
  const subscriberIds = Array.from(new Set(subscriptionRows.map((row) => row.subscriber_id)));

  if (subscriberIds.length === 0) {
    return {
      success: true,
      data: buildChannelSubscriptionSnapshot([], new Date(), {
        creatorId: user.id,
        customBadgeMonths: badgeAssetInfo.customMonths,
        subscriptionBadgeVersion: badgeAssetInfo.version,
        subscriptionBadgeImageSources,
        sort: normalizedSort,
      }),
    };
  }

  let profileQuery = supabase
    .from("user")
    .select("id, nickname, photo_url")
    .in("id", subscriberIds);

  if (normalizedQuery) {
    profileQuery = profileQuery.ilike("nickname", `%${normalizedQuery}%`);
  }

  const { data: profiles, error: profileError } = await profileQuery;

  if (profileError) {
    console.error("채널 구독자 프로필 조회 실패", profileError);
    return { success: false, code: APP_MESSAGE_CODE.error.channel.subscriptionLoadFailed };
  }

  const profileById = new Map(
    ((profiles ?? []) as SubscriberProfileRow[]).map((profile) => [profile.id, profile]),
  );

  const items: ChannelSubscriberItem[] = subscriptionRows.flatMap((subscription) => {
    const profile = profileById.get(subscription.subscriber_id);

    if (normalizedQuery && !profile) {
      return [];
    }

    return [createChannelSubscriberItem(subscription, profile ?? null)];
  });

  if (normalizedSort === "nickname_asc") {
    items.sort((a, b) => a.nickname.localeCompare(b.nickname, "ko-KR"));
  }

  return {
    success: true,
    data: buildChannelSubscriptionSnapshot(items, new Date(), {
      creatorId: user.id,
      customBadgeMonths: badgeAssetInfo.customMonths,
      subscriptionBadgeVersion: badgeAssetInfo.version,
      subscriptionBadgeImageSources,
      summarySubscribers,
      sort: normalizedSort,
    }),
  };
}

function createChannelSubscriberItem(
  subscription: CreatorSubscriptionRow,
  profile: SubscriberProfileRow | null,
): ChannelSubscriberItem {
  return {
    id: subscription.id,
    subscriberId: subscription.subscriber_id,
    nickname: profile?.nickname ?? UNKNOWN_SUBSCRIBER_NICKNAME,
    photoUrl: profile?.photo_url ?? null,
    startedAt: subscription.started_at,
    endAt: subscription.end_at,
    totalMonths: subscription.total_months,
    status: subscription.status,
  };
}

function normalizeChannelSubscriberSort(sort: ChannelSubscriberSort): ChannelSubscriberSort {
  return CHANNEL_SUBSCRIBER_SORT_VALUES.includes(sort) ? sort : "started_desc";
}
