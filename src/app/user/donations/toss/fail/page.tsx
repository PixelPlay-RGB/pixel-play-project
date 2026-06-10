// Toss Payments 결제 실패 리다이렉트를 안전한 후원 지갑 상태 메시지로 변환합니다.
import { markTossWalletChargeFailure } from "@/utils/payments/toss-wallet-charge";
import { redirect } from "next/navigation";

import { markTossFailureForRedirect } from "./toss-fail-redirect-marking";

interface Props {
  searchParams: Promise<{
    code?: string | string[];
    message?: string | string[];
    orderId?: string | string[];
  }>;
}

const TOSS_CANCEL_ERROR_CODES = new Set(["PAY_PROCESS_CANCELED", "PAY_PROCESS_ABORTED"]);

export default async function TossPaymentFailRedirectPage({ searchParams }: Props) {
  const params = await searchParams;
  const code = readSingleValue(params.code);
  const message = readSingleValue(params.message);
  const orderId = readSingleValue(params.orderId);
  const paymentStatus = TOSS_CANCEL_ERROR_CODES.has(code) ? "charge_canceled" : "charge_failed";

  if (code || message) {
    console.error("Toss 결제 실패 리다이렉트", { code, message });
  }

  await markTossFailureForRedirect({
    orderId,
    markFailure: () =>
      markTossWalletChargeFailure({
        orderId,
        code,
        status: paymentStatus === "charge_canceled" ? "canceled" : "failed",
      }),
  });

  redirect(`/user/donations?paymentStatus=${paymentStatus}`);
}

function readSingleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}
