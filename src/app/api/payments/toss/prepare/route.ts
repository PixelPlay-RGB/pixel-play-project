// Toss 결제창을 열기 전 충전 주문 정보를 준비하는 API 라우트입니다.
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import {
  WALLET_CHARGE_MAX_AMOUNT,
  WALLET_CHARGE_MIN_AMOUNT,
  WALLET_CHARGE_STEP_AMOUNT,
} from "@/constants/payments/wallet-charge";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createClient } from "@/lib/supabase/server";
import type { TossPaymentPrepareResponse } from "@/types/payments/toss-payment-api";
import { isAuthSessionMissingError } from "@/utils/auth/auth-error";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

interface PrepareRequestBody {
  amount?: unknown;
}

const WALLET_CHARGE_ORDER_PREFIX = "wallet";

export async function POST(request: Request) {
  const serverClient = await createClient();
  const {
    data: { user },
    error: userError,
  } = await serverClient.auth.getUser();

  if (userError && !isAuthSessionMissingError(userError)) {
    console.error("Toss 결제 준비 중 인증 사용자 조회 실패", userError);
  }

  if (!user) {
    return NextResponse.json(
      { code: APP_MESSAGE_CODE.error.auth.authInfoNotFound },
      { status: 401 },
    );
  }

  const amount = await readChargeAmount(request);

  if (!isValidChargeAmount(amount)) {
    return NextResponse.json(
      { code: APP_MESSAGE_CODE.error.donation.invalidChargeAmount },
      { status: 400 },
    );
  }

  const orderId = createWalletChargeOrderId();
  const idempotencyKey = createWalletChargeIdempotencyKey();
  const orderName = createWalletChargeOrderName(amount);
  const supabase = createAdminClient();
  const { error } = await supabase.from("wallet_transaction").insert({
    user_id: user.id,
    transaction_type: "charge",
    transaction_status: "pending",
    amount_delta: amount,
    balance_after: null,
    idempotency_key: idempotencyKey,
    order_id: orderId,
    payment_key: null,
    metadata: {
      paymentProvider: "toss",
      paymentType: "wallet_charge",
      preparedAt: new Date().toISOString(),
    },
  });

  if (error) {
    console.error("Toss 결제 준비 주문 저장 실패", error);
    return NextResponse.json(
      { code: APP_MESSAGE_CODE.error.donation.prepareChargeFailed },
      { status: 500 },
    );
  }

  const response: TossPaymentPrepareResponse = {
    orderId,
    orderName,
    amount,
  };

  return NextResponse.json(response);
}

async function readChargeAmount(request: Request) {
  try {
    const body = (await request.json()) as PrepareRequestBody;
    const amount = body.amount;

    if (typeof amount === "number") {
      return amount;
    }

    if (typeof amount === "string" && amount.trim() !== "") {
      return Number(amount);
    }
  } catch {
    return NaN;
  }

  return NaN;
}

function isValidChargeAmount(amount: number) {
  return (
    Number.isInteger(amount) &&
    amount >= WALLET_CHARGE_MIN_AMOUNT &&
    amount <= WALLET_CHARGE_MAX_AMOUNT &&
    amount % WALLET_CHARGE_STEP_AMOUNT === 0
  );
}

function createWalletChargeOrderId() {
  return `${WALLET_CHARGE_ORDER_PREFIX}${Date.now()}${randomUUID().replaceAll("-", "").slice(0, 16)}`;
}

function createWalletChargeIdempotencyKey() {
  return `wallet-charge:${randomUUID()}`;
}

function createWalletChargeOrderName(amount: number) {
  return `후원 지갑 충전 ${amount.toLocaleString("ko-KR")}원`;
}
