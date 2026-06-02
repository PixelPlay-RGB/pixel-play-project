// 사용자 후원 지갑 화면에 필요한 서버 데이터를 조회합니다.
import "server-only";

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createClient } from "@/lib/supabase/server";
import type { AppActionResult } from "@/types/common/action";
import type { AppMessageCode } from "@/constants/common/app-message-code";
import type { Database, Json } from "@/types/database.types";
import type {
  UserDonationFilter,
  UserDonationFreeGrantHistoryItem,
  UserDonationPurchaseHistoryItem,
  UserDonationSnapshot,
  UserDonationTab,
  UserDonationUsageHistoryItem,
  UserDonationUsageKind,
} from "@/types/donations/user-donations";
import { isAuthSessionMissingError } from "@/utils/auth/auth-error";

type WalletTransactionRow = Database["public"]["Tables"]["wallet_transaction"]["Row"];

type UserDonationSearchParams = {
  tab?: string | string[];
  year?: string | string[];
  month?: string | string[];
  kind?: string | string[];
};

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const USER_DONATION_HISTORY_LIMIT = 100;
const MIN_FILTER_YEAR = 2020;
const MAX_FILTER_YEAR = 2100;
const FREE_GRANT_SOURCE_SET = new Set([
  "admin_grant",
  "event",
  "free",
  "free_grant",
  "manual_grant",
  "promotion",
]);

export async function getUserDonationSnapshot(
  searchParams: UserDonationSearchParams,
): Promise<AppActionResult<UserDonationSnapshot>> {
  const serverClient = await createClient();
  const {
    data: { user },
    error: userError,
  } = await serverClient.auth.getUser();

  if (userError && !isAuthSessionMissingError(userError)) {
    console.error("사용자 후원 지갑 조회 중 인증 사용자 조회 실패", userError);
  }

  if (!user) {
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.auth.authInfoNotFound,
    };
  }

  const filter = normalizeUserDonationFilter(searchParams);
  const periodRange = getKstMonthRange(filter.period);
  const supabase = createAdminClient();

  const [walletResult, donationResult, transactionResult] = await Promise.all([
    supabase.from("wallet_account").select("balance_amount").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("donation")
      .select("id,broadcast_id,creator_id,amount,message,created_at")
      .eq("donor_id", user.id)
      .gte("created_at", periodRange.startIso)
      .lt("created_at", periodRange.endIso)
      .order("created_at", { ascending: false })
      .limit(USER_DONATION_HISTORY_LIMIT),
    supabase
      .from("wallet_transaction")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", periodRange.startIso)
      .lt("created_at", periodRange.endIso)
      .order("created_at", { ascending: false })
      .limit(USER_DONATION_HISTORY_LIMIT),
  ]);

  if (walletResult.error || donationResult.error || transactionResult.error) {
    console.error("사용자 후원 지갑 조회 실패", {
      walletError: walletResult.error,
      donationError: donationResult.error,
      transactionError: transactionResult.error,
    });

    return {
      success: false,
      code: APP_MESSAGE_CODE.error.common.unknown,
    };
  }

  const donations = donationResult.data ?? [];
  const walletTransactions = transactionResult.data ?? [];
  const creatorMap = await getCreatorNicknameMap(donations.map((donation) => donation.creator_id));
  const broadcastMap = await getBroadcastTitleMap(
    donations.map((donation) => donation.broadcast_id),
  );

  const usageHistories =
    filter.usageKind === "party"
      ? []
      : donations.map<UserDonationUsageHistoryItem>((donation) => ({
          id: donation.id,
          usedAt: donation.created_at,
          amount: donation.amount,
          content: broadcastMap.get(donation.broadcast_id) ?? "라이브 후원",
          channelName: creatorMap.get(donation.creator_id) ?? "알 수 없는 채널",
          message: donation.message,
        }));

  const freeGrantHistories = walletTransactions
    .filter(isFreeGrantTransaction)
    .map<UserDonationFreeGrantHistoryItem>((transaction) => {
      const metadata = readJsonObject(transaction.metadata);

      return {
        id: transaction.id,
        grantedAt: transaction.created_at,
        amount: transaction.amount_delta,
        content: readString(metadata?.title) ?? "무료 지급",
        reason:
          readString(metadata?.reason) ?? readString(metadata?.description) ?? "지급 사유 없음",
      };
    });

  const freeGrantTransactionIdSet = new Set(freeGrantHistories.map((item) => item.id));
  const purchaseHistories = walletTransactions
    .filter(
      (transaction) =>
        transaction.transaction_type === "charge" &&
        transaction.amount_delta > 0 &&
        !freeGrantTransactionIdSet.has(transaction.id),
    )
    .map<UserDonationPurchaseHistoryItem>((transaction) => ({
      id: transaction.id,
      purchasedAt: transaction.created_at,
      amount: transaction.amount_delta,
      content: "포인트 충전",
      status: transaction.transaction_status,
      orderId: transaction.order_id,
    }));

  return {
    success: true,
    data: {
      filter,
      summary: {
        balanceAmount: walletResult.data?.balance_amount ?? 0,
        monthlyUsageAmount: sumBy(usageHistories, (item) => item.amount),
        monthlyPurchaseAmount: sumBy(purchaseHistories, (item) => item.amount),
        monthlyFreeAmount: sumBy(freeGrantHistories, (item) => item.amount),
      },
      usageHistories,
      purchaseHistories,
      freeGrantHistories,
    },
  };
}

export function normalizeUserDonationFilter(
  searchParams: UserDonationSearchParams,
): UserDonationFilter {
  const currentPeriod = getCurrentKstPeriod();

  return {
    tab: normalizeTab(readFirstSearchParam(searchParams.tab)),
    usageKind: normalizeUsageKind(readFirstSearchParam(searchParams.kind)),
    period: {
      year: normalizeYear(readFirstSearchParam(searchParams.year), currentPeriod.year),
      month: normalizeMonth(readFirstSearchParam(searchParams.month), currentPeriod.month),
    },
  };
}

function getKstMonthRange(period: UserDonationFilter["period"]) {
  const startTime = Date.UTC(period.year, period.month - 1, 1) - KST_OFFSET_MS;
  const endTime = Date.UTC(period.year, period.month, 1) - KST_OFFSET_MS;

  return {
    startIso: new Date(startTime).toISOString(),
    endIso: new Date(endTime).toISOString(),
  };
}

async function getCreatorNicknameMap(creatorIds: string[]) {
  const uniqueCreatorIds = [...new Set(creatorIds)];

  if (uniqueCreatorIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("user")
    .select("id,nickname")
    .in("id", uniqueCreatorIds);

  if (error) {
    console.error("사용자 후원 내역 크리에이터 조회 실패", error);
    return new Map<string, string>();
  }

  return new Map((data ?? []).map((creator) => [creator.id, creator.nickname]));
}

async function getBroadcastTitleMap(broadcastIds: string[]) {
  const uniqueBroadcastIds = [...new Set(broadcastIds)];

  if (uniqueBroadcastIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("live_broadcast")
    .select("id,title")
    .in("id", uniqueBroadcastIds);

  if (error) {
    console.error("사용자 후원 내역 방송 조회 실패", error);
    return new Map<string, string>();
  }

  return new Map((data ?? []).map((broadcast) => [broadcast.id, broadcast.title]));
}

function normalizeTab(value?: string): UserDonationTab {
  return value === "purchase" || value === "free" ? value : "usage";
}

function normalizeUsageKind(value?: string): UserDonationUsageKind {
  return value === "party" ? "party" : "normal";
}

function normalizeYear(value: string | undefined, fallback: number) {
  const parsedYear = Number(value);

  return Number.isInteger(parsedYear) &&
    parsedYear >= MIN_FILTER_YEAR &&
    parsedYear <= MAX_FILTER_YEAR
    ? parsedYear
    : fallback;
}

function normalizeMonth(value: string | undefined, fallback: number) {
  const parsedMonth = Number(value);

  return Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12
    ? parsedMonth
    : fallback;
}

function getCurrentKstPeriod(): UserDonationFilter["period"] {
  const now = new Date(Date.now() + KST_OFFSET_MS);

  return {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
  };
}

function readFirstSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function isFreeGrantTransaction(transaction: WalletTransactionRow) {
  if (transaction.transaction_type !== "charge" || transaction.amount_delta <= 0) {
    return false;
  }

  const metadata = readJsonObject(transaction.metadata);
  const source =
    readString(metadata?.source) ??
    readString(metadata?.grantSource) ??
    readString(metadata?.type) ??
    readString(metadata?.kind) ??
    readString(metadata?.origin);

  return source ? FREE_GRANT_SOURCE_SET.has(source) : false;
}

function readJsonObject(value: Json): Record<string, Json | undefined> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json | undefined>)
    : null;
}

function readString(value: Json | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function sumBy<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce((sum, item) => sum + getValue(item), 0);
}

export const USER_DONATION_LOAD_FAILED_CODE: AppMessageCode = APP_MESSAGE_CODE.error.common.unknown;
