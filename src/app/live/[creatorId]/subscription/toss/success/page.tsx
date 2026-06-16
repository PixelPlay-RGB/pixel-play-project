// 라이브 구독 Toss 결제 성공 리다이렉트에서 서버 승인 처리를 수행합니다.
import { confirmTossCreatorSubscriptionPayment } from "@/utils/payments/toss-creator-subscription";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{
    creatorId: string;
  }>;
  searchParams: Promise<{
    amount?: string | string[];
    orderId?: string | string[];
    paymentKey?: string | string[];
  }>;
}

export default async function TossSubscriptionSuccessRedirectPage({ params, searchParams }: Props) {
  const routeParams = await params;
  const paymentParams = await searchParams;
  const result = await confirmTossCreatorSubscriptionPayment({
    creatorId: routeParams.creatorId,
    amount: readSingleValue(paymentParams.amount),
    orderId: readSingleValue(paymentParams.orderId),
    paymentKey: readSingleValue(paymentParams.paymentKey),
  });
  const paymentStatus = result.success ? "subscription_succeeded" : "subscription_failed";
  const nextParams = new URLSearchParams({
    subscriptionPaymentStatus: paymentStatus,
  });

  redirect(`/live/${routeParams.creatorId}?${nextParams.toString()}`);
}

function readSingleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}
