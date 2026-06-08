// 사용자 후원 지갑 화면에 필요한 서버 데이터를 조회합니다.
import "server-only";

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createClient } from "@/lib/supabase/server";
import type { AppActionResult } from "@/types/common/action";
import type { Json } from "@/types/database.types";
import type {
  UserDonationSnapshot,
  UserSentDonationItem,
  UserWalletChargeHistoryItem,
  WalletTransactionStatus,
} from "@/types/donations/user-donations";
import { isAuthSessionMissingError } from "@/utils/auth/auth-error";

type UserDonationSearchParams = {
  tab?: string | string[];
  year?: string | string[];
  month?: string | string[];
  kind?: string | string[];
};

const WALLET_TRANSACTION_STATUSES = new Set<WalletTransactionStatus>([
  "pending",
  "succeeded",
  "failed",
  "canceled",
]);

const MIN_HISTORY_YEAR = 2020;
const MAX_HISTORY_MONTH = 12;

export async function getUserDonationSnapshot(
  searchParams: UserDonationSearchParams = {},
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

  const supabase = createAdminClient();
  const historyPeriod = resolveHistoryPeriod(searchParams);
  const { data, error } = await supabase.rpc("get_user_donation_snapshot_v2", {
    p_actor_user_id: user.id,
    p_year: historyPeriod.year,
    p_month: historyPeriod.month,
  });

  if (error) {
    console.error("사용자 후원 지갑 조회 실패", error);
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.donation.loadFailed,
    };
  }

  try {
    return {
      success: true,
      data: buildUserDonationSnapshot(data, user.id, historyPeriod),
    };
  } catch (error) {
    console.error("사용자 후원 지갑 snapshot 생성 실패", error);
    return {
      success: false,
      code: APP_MESSAGE_CODE.error.donation.loadFailed,
    };
  }
}

function buildUserDonationSnapshot(
  snapshot: Json,
  paymentCustomerKey: string,
  fallbackHistoryPeriod: { year: number; month: number },
): UserDonationSnapshot {
  const snapshotObject = readObject(snapshot);
  const wallet = readObject(snapshotObject?.wallet);
  const stats = readObject(snapshotObject?.stats);
  const historyPeriod = readObject(snapshotObject?.historyPeriod);
  const sentDonations = readArray(snapshotObject?.sentDonations)
    .map(readSentDonation)
    .filter((item): item is UserSentDonationItem => item !== null);
  const chargeHistories = readArray(snapshotObject?.chargeHistories)
    .map(readChargeHistory)
    .filter((item): item is UserWalletChargeHistoryItem => item !== null);

  return {
    paymentCustomerKey,
    summary: {
      balanceAmount: readNumber(wallet?.balanceAmount, 0),
    },
    stats: {
      currentMonthDonationAmount: readNumber(stats?.currentMonthDonationAmount, 0),
      currentMonthChargeAmount: readNumber(stats?.currentMonthChargeAmount, 0),
      totalDonationAmount: readNumber(stats?.totalDonationAmount, 0),
      totalChargeAmount: readNumber(stats?.totalChargeAmount, 0),
    },
    historyPeriod: {
      year: readNumber(historyPeriod?.year, fallbackHistoryPeriod.year),
      month: readNumber(historyPeriod?.month, fallbackHistoryPeriod.month),
    },
    sentDonations,
    chargeHistories,
  };
}

function resolveHistoryPeriod(searchParams: UserDonationSearchParams) {
  const now = new Date();
  const currentYear = Number(
    new Intl.DateTimeFormat("en", {
      timeZone: "Asia/Seoul",
      year: "numeric",
    }).format(now),
  );
  const currentMonth = Number(
    new Intl.DateTimeFormat("en", {
      timeZone: "Asia/Seoul",
      month: "numeric",
    }).format(now),
  );
  const year = readPositiveIntegerParam(searchParams.year);
  const month = readPositiveIntegerParam(searchParams.month);

  return {
    year: year && year >= MIN_HISTORY_YEAR ? year : currentYear,
    month: month && month <= MAX_HISTORY_MONTH ? month : currentMonth,
  };
}

function readPositiveIntegerParam(value: string | string[] | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return null;
  }

  return numberValue;
}

function readSentDonation(value: Json): UserSentDonationItem | null {
  const item = readObject(value);
  const id = readText(item?.id);
  const broadcastId = readText(item?.broadcastId);
  const creatorId = readText(item?.creatorId);
  const amount = readNumber(item?.amount, 0);
  const createdAt = readText(item?.createdAt);

  if (!item || !id || !broadcastId || !creatorId || amount <= 0 || !createdAt) {
    return null;
  }

  return {
    id,
    broadcastId,
    creatorId,
    creatorNickname: readText(item.creatorNickname) || "알 수 없음",
    amount,
    message: readText(item.message),
    createdAt,
  };
}

function readChargeHistory(value: Json): UserWalletChargeHistoryItem | null {
  const item = readObject(value);
  const id = readText(item?.id);
  const createdAt = readText(item?.createdAt);
  const type = readText(item?.type);
  const amount = readNumber(item?.amount, readNumber(item?.amountDelta, 0));

  if (!item || !id || !createdAt || amount <= 0) {
    return null;
  }

  if (type && type !== "charge") {
    return null;
  }

  return {
    id,
    status: readTransactionStatus(item.status),
    amount,
    balanceAfter: readNullableNumber(item.balanceAfter),
    createdAt,
  };
}

function readTransactionStatus(value: Json | undefined): WalletTransactionStatus {
  if (
    typeof value === "string" &&
    WALLET_TRANSACTION_STATUSES.has(value as WalletTransactionStatus)
  ) {
    return value as WalletTransactionStatus;
  }

  return "pending";
}

function readArray(value: Json | undefined): Json[] {
  return Array.isArray(value) ? value : [];
}

function readObject(value: Json | undefined): Record<string, Json | undefined> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value;
}

function readText(value: Json | undefined) {
  return typeof value === "string" ? value : "";
}

function readNumber(value: Json | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readNullableNumber(value: Json | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
