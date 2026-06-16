// 후원 지갑 충전(TossPayments)의 클라이언트 공용 로직입니다.
// 지갑 충전 카드(/user/donations)와 라이브 후원 충전이 함께 재사용합니다.

import {
  WALLET_CHARGE_MAX_AMOUNT,
  WALLET_CHARGE_MIN_AMOUNT,
  WALLET_CHARGE_STEP_AMOUNT,
} from "@/constants/payments/wallet-charge";
import type { TossPaymentPrepareResponse } from "@/types/payments/toss-payment-api";

// 사용자가 결제창/QR을 닫아 취소한 경우의 토스 에러 코드. 취소는 실패가 아니라 정상 흐름으로 다룬다.
const TOSS_PAYMENT_CANCEL_CODES = new Set([
  "USER_CANCEL",
  "PAY_PROCESS_CANCELED",
  "PAY_PROCESS_ABORTED",
]);

export function isValidChargeAmount(value: number | undefined): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= WALLET_CHARGE_MIN_AMOUNT &&
    value <= WALLET_CHARGE_MAX_AMOUNT &&
    value % WALLET_CHARGE_STEP_AMOUNT === 0
  );
}

export function isTossPaymentCancelError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = (error as { code?: unknown }).code;

  return typeof code === "string" && TOSS_PAYMENT_CANCEL_CODES.has(code);
}

export async function prepareTossWalletCharge(amount: number): Promise<TossPaymentPrepareResponse> {
  const response = await fetch("/api/payments/toss/prepare", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount }),
  });

  if (!response.ok) {
    throw new Error("Toss 결제 준비 실패");
  }

  const data = (await response.json()) as unknown;

  if (!isTossPaymentPrepareResponse(data)) {
    throw new Error("Toss 결제 준비 응답 형식 오류");
  }

  return data;
}

function isTossPaymentPrepareResponse(value: unknown): value is TossPaymentPrepareResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const response = value as Partial<TossPaymentPrepareResponse>;

  return (
    typeof response.orderId === "string" &&
    typeof response.orderName === "string" &&
    isValidChargeAmount(response.amount)
  );
}
