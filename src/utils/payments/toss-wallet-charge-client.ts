// 후원 지갑 충전(TossPayments)의 클라이언트 공용 로직입니다.
// 지갑 충전 카드(/user/donations)와 라이브 후원 충전이 함께 재사용합니다.

import type { TossPaymentPrepareResponse } from "@/types/payments/toss-payment-api";
import { isValidChargeAmount } from "@/utils/payments/wallet-charge-amount";

// 기존 import 경로(@/utils/payments/toss-wallet-charge-client) 호환을 위해 공용 검증 함수를 재노출한다.
export { isValidChargeAmount };

// 사용자가 결제창/QR을 닫아 취소한 경우의 토스 에러 코드. 취소는 실패가 아니라 정상 흐름으로 다룬다.
const TOSS_PAYMENT_CANCEL_CODES = new Set([
  "USER_CANCEL",
  "PAY_PROCESS_CANCELED",
  "PAY_PROCESS_ABORTED",
]);

export function isTossPaymentCancelError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = (error as { code?: unknown }).code;

  return typeof code === "string" && TOSS_PAYMENT_CANCEL_CODES.has(code);
}

// 결제 후 카드사 앱으로 리다이렉트될 수 있는 기기(모바일·태블릿)인지 판단한다(PAY-013).
// 이런 기기에서 iframe+Promise 방식을 쓰면 카드사 앱으로 전환된 뒤 Promise가 resolve되지 않아
// 결제창이 멈춘다. 화면 폭(useIsMobile)으로 판단하면 가로 태블릿(≥768px)이 PC로 잡혀 멈추므로,
// userAgent와 멀티터치로 기기를 판단해 successUrl/failUrl 리다이렉트로 폴백한다.
export function prefersRedirectPayment(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPod|iPad|Mobile/i.test(ua)) {
    return true;
  }
  // iPadOS 13+는 데스크탑 Safari(Macintosh)로 위장하지만 멀티터치가 있어 이로 구분한다.
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) {
    return true;
  }
  return false;
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
