// Toss Payments 지갑 충전 승인과 실패 상태 반영을 처리합니다.
import "server-only";

import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type { AppMessageCode } from "@/constants/common/app-message-code";
import {
  WALLET_CHARGE_MAX_AMOUNT,
  WALLET_CHARGE_MIN_AMOUNT,
  WALLET_CHARGE_STEP_AMOUNT,
} from "@/constants/payments/wallet-charge";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createClient } from "@/lib/supabase/server";
import type { AppActionResult } from "@/types/common/action";
import type { Database, Json } from "@/types/database.types";
import type { TossPaymentConfirmResponse } from "@/types/payments/toss-payment-api";
import { isAuthSessionMissingError } from "@/utils/auth/auth-error";

type WalletTransactionRow = Database["public"]["Tables"]["wallet_transaction"]["Row"];
type WalletTransactionStatus = Database["public"]["Enums"]["wallet_transaction_status"];
type PendingWalletCharge = Pick<
  WalletTransactionRow,
  | "id"
  | "user_id"
  | "transaction_type"
  | "transaction_status"
  | "amount_delta"
  | "balance_after"
  | "idempotency_key"
  | "order_id"
  | "payment_key"
  | "metadata"
>;

interface TossPaymentConfirmInput {
  paymentKey?: unknown;
  orderId?: unknown;
  amount?: unknown;
}

interface TossPaymentFailureInput {
  orderId?: unknown;
  code?: unknown;
  status: Extract<WalletTransactionStatus, "failed" | "canceled">;
}

type TossPaymentConfirmResult =
  | (AppActionResult<TossPaymentConfirmResponse> & { success: true; status: 200 })
  | (AppActionResult & { success: false; code: AppMessageCode; status: number });

const TOSS_PAYMENTS_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";
const WALLET_CHARGE_SELECT =
  "id,user_id,transaction_type,transaction_status,amount_delta,balance_after,idempotency_key,order_id,payment_key,metadata";

export async function confirmTossWalletCharge(
  input: TossPaymentConfirmInput,
): Promise<TossPaymentConfirmResult> {
  const parsedInput = parseTossPaymentConfirmInput(input);

  if (!parsedInput) {
    return createConfirmFailure(APP_MESSAGE_CODE.error.donation.confirmChargeFailed, 400);
  }

  if (!isValidChargeAmount(parsedInput.amount)) {
    return createConfirmFailure(APP_MESSAGE_CODE.error.donation.invalidChargeAmount, 400);
  }

  const userResult = await getAuthenticatedUserId();

  if (!userResult.success) {
    return createConfirmFailure(userResult.code, userResult.status);
  }

  const supabase = createAdminClient();
  const pendingResult = await getWalletChargeByOrderId(parsedInput.orderId, userResult.userId);

  if (!pendingResult.success) {
    return createConfirmFailure(pendingResult.code, pendingResult.status);
  }

  const walletCharge = pendingResult.walletCharge;
  const replayedResult = getReplayConfirmedCharge(walletCharge, parsedInput);

  if (replayedResult) {
    return {
      success: true,
      status: 200,
      data: replayedResult,
    };
  }

  if (walletCharge.transaction_status !== "pending") {
    return createConfirmFailure(APP_MESSAGE_CODE.error.donation.confirmChargeFailed, 409);
  }

  if (walletCharge.amount_delta !== parsedInput.amount) {
    return createConfirmFailure(APP_MESSAGE_CODE.error.donation.invalidChargeAmount, 400);
  }

  if (!walletCharge.idempotency_key) {
    console.error("Toss 결제 승인 대상 주문에 멱등키가 없습니다.", {
      orderId: parsedInput.orderId,
    });
    return createConfirmFailure(APP_MESSAGE_CODE.error.donation.confirmChargeFailed, 500);
  }

  const tossConfirmResult = await requestTossPaymentConfirm(
    parsedInput,
    walletCharge.idempotency_key,
  );

  if (!tossConfirmResult.success) {
    if (tossConfirmResult.shouldMarkFailed) {
      await markWalletChargeStatus(walletCharge, "failed", "TOSS_CONFIRM_FAILED");
    }
    return createConfirmFailure(
      APP_MESSAGE_CODE.error.donation.confirmChargeFailed,
      tossConfirmResult.status,
    );
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc("confirm_wallet_charge", {
    p_actor_user_id: userResult.userId,
    p_amount: parsedInput.amount,
    p_idempotency_key: walletCharge.idempotency_key,
    p_payment_key: parsedInput.paymentKey,
    p_order_id: parsedInput.orderId,
    p_metadata: createConfirmMetadata(parsedInput, tossConfirmResult.data),
  });

  if (rpcError) {
    console.error("Toss 결제 승인 후 지갑 충전 반영 실패", rpcError);
    return createConfirmFailure(APP_MESSAGE_CODE.error.donation.confirmChargeFailed, 500);
  }

  const chargeResult = readWalletChargeResult(rpcData);

  return {
    success: true,
    status: 200,
    data: {
      orderId: parsedInput.orderId,
      amount: parsedInput.amount,
      paymentKey: parsedInput.paymentKey,
      balanceAfter: chargeResult.balanceAfter,
      replayed: chargeResult.replayed,
    },
  };
}

export async function markTossWalletChargeFailure(input: TossPaymentFailureInput) {
  const orderId = readText(input.orderId);

  if (!orderId) {
    return;
  }

  const userResult = await getAuthenticatedUserId();

  if (!userResult.success) {
    return;
  }

  const pendingResult = await getWalletChargeByOrderId(orderId, userResult.userId);

  if (!pendingResult.success || pendingResult.walletCharge.transaction_status !== "pending") {
    return;
  }

  await markWalletChargeStatus(pendingResult.walletCharge, input.status, readText(input.code));
}

async function getAuthenticatedUserId() {
  const serverClient = await createClient();
  const {
    data: { user },
    error: userError,
  } = await serverClient.auth.getUser();

  if (userError && !isAuthSessionMissingError(userError)) {
    console.error("Toss 결제 처리 중 인증 사용자 조회 실패", userError);
  }

  if (!user) {
    return {
      success: false as const,
      code: APP_MESSAGE_CODE.error.auth.authInfoNotFound,
      status: 401,
    };
  }

  return {
    success: true as const,
    userId: user.id,
  };
}

async function getWalletChargeByOrderId(orderId: string, userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("wallet_transaction")
    .select(WALLET_CHARGE_SELECT)
    .eq("order_id", orderId)
    .eq("user_id", userId)
    .eq("transaction_type", "charge")
    .maybeSingle();

  if (error) {
    console.error("Toss 결제 승인 대상 주문 조회 실패", error);
    return {
      success: false as const,
      code: APP_MESSAGE_CODE.error.donation.confirmChargeFailed,
      status: 500,
    };
  }

  if (!data) {
    return {
      success: false as const,
      code: APP_MESSAGE_CODE.error.donation.confirmChargeFailed,
      status: 404,
    };
  }

  return {
    success: true as const,
    walletCharge: data as PendingWalletCharge,
  };
}

async function requestTossPaymentConfirm(
  input: Required<TossPaymentConfirmInput> & {
    amount: number;
    orderId: string;
    paymentKey: string;
  },
  idempotencyKey: string,
) {
  const secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY;

  if (!secretKey) {
    console.error("TOSS_PAYMENTS_SECRET_KEY가 설정되지 않았습니다.");
    return {
      success: false as const,
      status: 500,
      shouldMarkFailed: false,
    };
  }

  const response = await fetch(TOSS_PAYMENTS_CONFIRM_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      paymentKey: input.paymentKey,
      orderId: input.orderId,
      amount: input.amount,
    }),
    cache: "no-store",
  }).catch((error: unknown) => {
    console.error("Toss 결제 승인 API 네트워크 호출 실패", error);
    return null;
  });

  if (!response) {
    return {
      success: false as const,
      status: 502,
      shouldMarkFailed: false,
    };
  }
  const data = await readJsonResponse(response);

  if (!response.ok) {
    console.error("Toss 결제 승인 API 호출 실패", {
      status: response.status,
      data,
    });
    return {
      success: false as const,
      status: response.status,
      shouldMarkFailed: true,
    };
  }

  return {
    success: true as const,
    data,
  };
}

async function markWalletChargeStatus(
  walletCharge: PendingWalletCharge,
  status: Extract<WalletTransactionStatus, "failed" | "canceled">,
  code: string,
) {
  const supabase = createAdminClient();
  const metadata: Json = {
    ...readJsonObject(walletCharge.metadata),
    paymentProvider: "toss",
    paymentType: "wallet_charge",
    tossFailureCode: code || null,
    failedAt: status === "failed" ? new Date().toISOString() : null,
    canceledAt: status === "canceled" ? new Date().toISOString() : null,
  };
  const { error } = await supabase
    .from("wallet_transaction")
    .update({
      transaction_status: status,
      metadata,
    })
    .eq("id", walletCharge.id)
    .eq("transaction_status", "pending");

  if (error) {
    console.error("Toss 결제 실패 주문 상태 반영 실패", error);
  }
}

function parseTossPaymentConfirmInput(input: TossPaymentConfirmInput) {
  const paymentKey = readText(input.paymentKey);
  const orderId = readText(input.orderId);
  const amount = readAmount(input.amount);

  if (!paymentKey || !orderId || !Number.isFinite(amount)) {
    return null;
  }

  return {
    paymentKey,
    orderId,
    amount,
  };
}

function getReplayConfirmedCharge(
  walletCharge: PendingWalletCharge,
  input: { paymentKey: string; orderId: string; amount: number },
): TossPaymentConfirmResponse | null {
  if (walletCharge.transaction_status !== "succeeded") {
    return null;
  }

  if (walletCharge.amount_delta !== input.amount) {
    return null;
  }

  if (walletCharge.payment_key && walletCharge.payment_key !== input.paymentKey) {
    return null;
  }

  return {
    orderId: input.orderId,
    amount: input.amount,
    paymentKey: input.paymentKey,
    balanceAfter: walletCharge.balance_after,
    replayed: true,
  };
}

function createConfirmMetadata(
  input: { paymentKey: string; orderId: string },
  tossPayment: unknown,
): Json {
  return {
    paymentProvider: "toss",
    paymentType: "wallet_charge",
    tossOrderId: input.orderId,
    tossPaymentKey: input.paymentKey,
    tossMethod: readObjectText(tossPayment, "method"),
    tossStatus: readObjectText(tossPayment, "status"),
    approvedAt: readObjectText(tossPayment, "approvedAt"),
    confirmedAt: new Date().toISOString(),
  };
}

function readWalletChargeResult(value: Json) {
  const result = readJsonObject(value);

  return {
    balanceAfter: readNullableNumber(result.balanceAfter),
    replayed: result.replayed === true,
  };
}

function readJsonObject(value: Json | undefined): Record<string, Json | undefined> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value;
}

function readObjectText(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const item = (value as Record<string, unknown>)[key];

  return typeof item === "string" ? item : null;
}

function readText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readAmount(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    return Number(value);
  }

  return NaN;
}

function readNullableNumber(value: Json | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function readJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isValidChargeAmount(amount: number) {
  return (
    Number.isInteger(amount) &&
    amount >= WALLET_CHARGE_MIN_AMOUNT &&
    amount <= WALLET_CHARGE_MAX_AMOUNT &&
    amount % WALLET_CHARGE_STEP_AMOUNT === 0
  );
}

function createConfirmFailure(code: AppMessageCode, status: number) {
  return {
    success: false as const,
    code,
    status,
  };
}
