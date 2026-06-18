// 라이브 구독 Toss 결제 실패 리다이렉트를 구독 결제 상태로 반영합니다.
import { readSingleSearchParam } from "@/utils/common/search-params";
import { markTossCreatorSubscriptionPaymentFailure } from "@/utils/payments/toss-creator-subscription";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{
    creatorId: string;
  }>;
  searchParams: Promise<{
    code?: string | string[];
    message?: string | string[];
    orderId?: string | string[];
  }>;
}

const TOSS_CANCEL_ERROR_CODES = new Set(["PAY_PROCESS_CANCELED", "PAY_PROCESS_ABORTED"]);

export default async function TossSubscriptionFailRedirectPage({ params, searchParams }: Props) {
  const routeParams = await params;
  const paymentParams = await searchParams;
  const code = readSingleSearchParam(paymentParams.code);
  const message = readSingleSearchParam(paymentParams.message);
  const orderId = readSingleSearchParam(paymentParams.orderId);
  const paymentStatus = TOSS_CANCEL_ERROR_CODES.has(code)
    ? "subscription_canceled"
    : "subscription_failed";

  if (code || message) {
    console.error("Toss 구독 결제 실패 리다이렉트", { code, message });
  }

  await markTossCreatorSubscriptionPaymentFailure({
    orderId,
    code,
    message,
    status: paymentStatus === "subscription_canceled" ? "canceled" : "failed",
  });

  redirect(`/live/${routeParams.creatorId}?subscriptionPaymentStatus=${paymentStatus}`);
}
