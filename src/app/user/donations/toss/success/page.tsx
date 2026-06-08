// Toss Payments 결제 성공 리다이렉트에서 서버 승인 처리를 수행합니다.
import { confirmTossWalletCharge } from "@/lib/payments/toss-wallet-charge";
import { redirect } from "next/navigation";

import { getTossSuccessRedirectPaymentStatus } from "./toss-success-redirect-status";

interface Props {
  searchParams: Promise<{
    amount?: string | string[];
    orderId?: string | string[];
    paymentKey?: string | string[];
  }>;
}

export default async function TossPaymentSuccessRedirectPage({ searchParams }: Props) {
  const params = await searchParams;
  const paymentStatus = await getTossSuccessRedirectPaymentStatus(() =>
    confirmTossWalletCharge({
      amount: readSingleValue(params.amount),
      orderId: readSingleValue(params.orderId),
      paymentKey: readSingleValue(params.paymentKey),
    }),
  );
  const nextParams = new URLSearchParams({
    paymentStatus,
  });

  redirect(`/user/donations?${nextParams.toString()}`);
}

function readSingleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}
