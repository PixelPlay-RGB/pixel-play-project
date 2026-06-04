// Toss Payments 결제 인증 실패 리다이렉트를 처리합니다.
import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<{
    code?: string | string[];
    message?: string | string[];
  }>;
}

export default async function TossPaymentFailRedirectPage({ searchParams }: Props) {
  const params = await searchParams;
  const nextParams = new URLSearchParams({ paymentStatus: "fail" });

  appendSingleValue(nextParams, "code", params.code);

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
