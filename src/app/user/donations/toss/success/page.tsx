// Toss Payments 결제 성공 리다이렉트에서 서버 승인 처리를 수행합니다.
import { readSingleSearchParam } from "@/utils/common/search-params";
import { buildPaymentReturnRedirect } from "@/utils/payments/payment-return-path";
import { confirmTossWalletCharge } from "@/utils/payments/toss-wallet-charge";
import { redirect } from "next/navigation";

import { getTossSuccessRedirectPaymentStatus } from "./toss-success-redirect-status";

interface Props {
  searchParams: Promise<{
    amount?: string | string[];
    orderId?: string | string[];
    paymentKey?: string | string[];
    returnTo?: string | string[];
  }>;
}

export default async function TossPaymentSuccessRedirectPage({ searchParams }: Props) {
  const params = await searchParams;
  const paymentStatus = await getTossSuccessRedirectPaymentStatus(() =>
    confirmTossWalletCharge({
      amount: readSingleSearchParam(params.amount),
      orderId: readSingleSearchParam(params.orderId),
      paymentKey: readSingleSearchParam(params.paymentKey),
    }),
  );
  redirect(buildPaymentReturnRedirect(params.returnTo, paymentStatus));
}
