// Toss Payments 결제 인증 성공 리다이렉트를 처리합니다.
import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<{
    amount?: string | string[];
    orderId?: string | string[];
    paymentKey?: string | string[];
    paymentType?: string | string[];
  }>;
}

export default async function TossPaymentSuccessRedirectPage({ searchParams }: Props) {
  const params = await searchParams;
  const nextParams = new URLSearchParams({ paymentStatus: "success" });

  appendSingleValue(nextParams, "amount", params.amount);
  appendSingleValue(nextParams, "orderId", params.orderId);
  appendSingleValue(nextParams, "paymentType", params.paymentType);

  redirect(`/user/donations?${nextParams.toString()}`);
}

function appendSingleValue(
  params: URLSearchParams,
  key: string,
  value: string | string[] | undefined,
) {
  if (typeof value === "string" && value) {
    params.set(key, value);
  }
}
