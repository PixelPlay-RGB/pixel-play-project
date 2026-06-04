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
  UserWalletTransactionItem,
  WalletTransactionStatus,
  WalletTransactionType,
} from "@/types/donations/user-donations";
import { isAuthSessionMissingError } from "@/utils/auth/auth-error";

type UserDonationSearchParams = {
  tab?: string | string[];
  year?: string | string[];
  month?: string | string[];
  kind?: string | string[];
};

const WALLET_TRANSACTION_TYPES = new Set<WalletTransactionType>([
  "charge",
  "donation_spend",
  "refund",
]);

const WALLET_TRANSACTION_STATUSES = new Set<WalletTransactionStatus>([
  "pending",
  "succeeded",
  "failed",
  "canceled",
]);

export async function getUserDonationSnapshot(
  _searchParams: UserDonationSearchParams = {},
): Promise<AppActionResult<UserDonationSnapshot>> {
  void _searchParams;

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
  const { data, error } = await supabase.rpc("get_user_donation_snapshot", {
    p_actor_user_id: user.id,
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
      data: buildUserDonationSnapshot(data, user.id),
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
): UserDonationSnapshot {
  const snapshotObject = readObject(snapshot);
  const wallet = readObject(snapshotObject?.wallet);
  const sentDonations = readArray(snapshotObject?.sentDonations)
    .map(readSentDonation)
    .filter((item): item is UserSentDonationItem => item !== null);
  const transactions = readArray(snapshotObject?.transactions)
    .map(readWalletTransaction)
    .filter((item): item is UserWalletTransactionItem => item !== null);

  return {
    paymentCustomerKey,
    summary: {
      balanceAmount: readNumber(wallet?.balanceAmount, 0),
      sentDonationAmount: sumBy(sentDonations, (item) => item.amount),
      chargeAmount: sumBy(
        transactions.filter(
          (transaction) => transaction.type === "charge" && transaction.status === "succeeded",
        ),
        (item) => item.amountDelta,
      ),
      transactionCount: transactions.length,
    },
    sentDonations,
    transactions,
  };
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

function readWalletTransaction(value: Json): UserWalletTransactionItem | null {
  const item = readObject(value);
  const id = readText(item?.id);
  const createdAt = readText(item?.createdAt);

  if (!item || !id || !createdAt) {
    return null;
  }

  return {
    id,
    type: readTransactionType(item.type),
    status: readTransactionStatus(item.status),
    amountDelta: readNumber(item.amountDelta, 0),
    balanceAfter: readNullableNumber(item.balanceAfter),
    createdAt,
  };
}

function readTransactionType(value: Json | undefined): WalletTransactionType {
  if (typeof value === "string" && WALLET_TRANSACTION_TYPES.has(value as WalletTransactionType)) {
    return value as WalletTransactionType;
  }

  return "charge";
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

function sumBy<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce((sum, item) => sum + getValue(item), 0);
}
