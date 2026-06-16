// 사용자 구독 관리 페이지에 필요한 구독과 배지 데이터를 조회합니다.
import "server-only";

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { USER_MEDIA_BUCKET } from "@/constants/common/storage";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createClient } from "@/lib/supabase/server";
import type { AppActionResult } from "@/types/common/action";
import type { GenericTables } from "@/types/common/supabase.types";
import type {
  UserSubscriptionBadgeSnapshot,
  UserSubscriptionItem,
  UserSubscriptionSnapshot,
} from "@/types/subscriptions/user-subscriptions";
import { isAuthSessionMissingError } from "@/utils/auth/auth-error";
import {
  getLiveSubscriptionBadgeSourcesByMonth,
  readLiveSubscriptionBadgeAssetInfo,
} from "@/utils/live/live-subscription-badge";
import { isSubscriptionBenefitActive } from "@/utils/subscriptions/user-subscription-status";

type CreatorSubscriptionRow = Pick<
  GenericTables<"creator_subscription">,
  "id" | "creator_id" | "started_at" | "end_at" | "total_months" | "status"
>;

type CreatorProfileRow = Pick<GenericTables<"user">, "id" | "nickname" | "photo_url">;
type AdminClient = ReturnType<typeof createAdminClient>;

const UNKNOWN_CREATOR_NICKNAME = "알 수 없음";

export async function getUserSubscriptionSnapshot(): Promise<
  AppActionResult<UserSubscriptionSnapshot>
> {
  const serverClient = await createClient();
  const {
    data: { user },
    error: userError,
  } = await serverClient.auth.getUser();

  if (userError && !isAuthSessionMissingError(userError)) {
    console.error("사용자 구독 조회 중 인증 사용자 조회 실패", userError);
  }

  if (!user) {
    return { success: false, code: APP_MESSAGE_CODE.error.auth.authInfoNotFound };
  }

  const supabase = createAdminClient();
  const { data: subscriptions, error: subscriptionError } = await supabase
    .from("creator_subscription")
    .select("id, creator_id, started_at, end_at, total_months, status")
    .eq("subscriber_id", user.id)
    .order("started_at", { ascending: false });

  if (subscriptionError) {
    console.error("사용자 구독 목록 조회 실패", subscriptionError);
    return { success: false, code: APP_MESSAGE_CODE.error.user.subscriptionLoadFailed };
  }

  const subscriptionRows = (subscriptions ?? []) as CreatorSubscriptionRow[];

  if (subscriptionRows.length === 0) {
    return {
      success: true,
      data: {
        activeSubscriptions: [],
        expiredSubscriptions: [],
      },
    };
  }

  const creatorIds = Array.from(new Set(subscriptionRows.map((row) => row.creator_id)));
  const { data: profiles, error: profileError } = await supabase
    .from("user")
    .select("id, nickname, photo_url")
    .in("id", creatorIds);

  if (profileError) {
    console.error("사용자 구독 방송인 프로필 조회 실패", profileError);
    return { success: false, code: APP_MESSAGE_CODE.error.user.subscriptionLoadFailed };
  }

  const profileById = new Map(
    ((profiles ?? []) as CreatorProfileRow[]).map((profile) => [profile.id, profile]),
  );
  const assetByCreatorId = new Map(
    await Promise.all(
      creatorIds.map(
        async (creatorId) =>
          [creatorId, await readCreatorSubscriptionAssets(supabase, creatorId)] as const,
      ),
    ),
  );
  const now = new Date();
  const items = subscriptionRows.map((subscription) =>
    createUserSubscriptionItem({
      subscription,
      profile: profileById.get(subscription.creator_id) ?? null,
      assets: assetByCreatorId.get(subscription.creator_id) ?? createEmptySubscriptionAssets(),
      now,
    }),
  );

  return {
    success: true,
    data: {
      activeSubscriptions: items.filter((item) => item.isActive),
      expiredSubscriptions: items.filter((item) => !item.isActive),
    },
  };
}

async function readCreatorSubscriptionAssets(
  supabase: AdminClient,
  creatorId: string,
): Promise<Pick<UserSubscriptionItem, "badge">> {
  const badgeFilesResult = await supabase.storage
    .from(USER_MEDIA_BUCKET)
    .list(`${creatorId}/subscription`, {
      limit: 120,
      sortBy: { column: "name", order: "asc" },
    });

  if (badgeFilesResult.error) {
    console.error("사용자 구독 배지 목록 조회 실패", badgeFilesResult.error);
  }

  const badgeInfo = readLiveSubscriptionBadgeAssetInfo(badgeFilesResult.data ?? null);
  const badge: UserSubscriptionBadgeSnapshot = {
    ...badgeInfo,
    imageSourcesByMonth: getLiveSubscriptionBadgeSourcesByMonth(creatorId, badgeInfo),
  };

  return {
    badge,
  };
}

function createEmptySubscriptionAssets(): Pick<UserSubscriptionItem, "badge"> {
  const badgeInfo = readLiveSubscriptionBadgeAssetInfo(null);

  return {
    badge: {
      ...badgeInfo,
      imageSourcesByMonth: {},
    },
  };
}

function createUserSubscriptionItem({
  subscription,
  profile,
  assets,
  now,
}: {
  subscription: CreatorSubscriptionRow;
  profile: CreatorProfileRow | null;
  assets: Pick<UserSubscriptionItem, "badge">;
  now: Date;
}): UserSubscriptionItem {
  return {
    id: subscription.id,
    creatorId: subscription.creator_id,
    creatorNickname: profile?.nickname ?? UNKNOWN_CREATOR_NICKNAME,
    creatorPhotoUrl: profile?.photo_url ?? null,
    startedAt: subscription.started_at,
    endAt: subscription.end_at,
    totalMonths: subscription.total_months,
    status: subscription.status,
    isActive: isSubscriptionActive(subscription, now),
    badge: assets.badge,
  };
}

function isSubscriptionActive(subscription: CreatorSubscriptionRow, now: Date) {
  return isSubscriptionBenefitActive(
    {
      status: subscription.status,
      endAt: subscription.end_at,
    },
    now,
  );
}
