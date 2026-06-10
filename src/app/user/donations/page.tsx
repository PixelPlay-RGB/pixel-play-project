// 사용자 후원 지갑 페이지를 렌더링합니다.
import { getUserDonationSnapshot } from "@/app/user/donations/_data/user-donation-data";
import { UserDonationsPage } from "@/components/donations/user-donations-page";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type { AppMessageCode } from "@/constants/common/app-message-code";
import type { Metadata } from "next";

interface Props {
  searchParams: Promise<{
    tab?: string | string[];
    year?: string | string[];
    month?: string | string[];
    kind?: string | string[];
    paymentStatus?: string | string[];
  }>;
}

const PAYMENT_STATUS_MESSAGE_CODE: Record<string, AppMessageCode> = {
  charge_success: APP_MESSAGE_CODE.success.donation.chargeConfirmed,
  charge_failed: APP_MESSAGE_CODE.error.donation.chargeFailed,
  charge_canceled: APP_MESSAGE_CODE.error.donation.chargeCanceled,
};

export const metadata: Metadata = {
  title: "후원 지갑",
  description: "PixelPlay 후원 지갑 잔액과 충전, 후원 내역을 확인합니다.",
};

export default async function UserDonationsRoutePage({ searchParams }: Props) {
  const params = await searchParams;
  const result = await getUserDonationSnapshot(params);

  return (
    <UserDonationsPage
      snapshot={result.data ?? null}
      errorCode={result.code}
      paymentResultCode={getPaymentResultCode(params.paymentStatus)}
    />
  );
}

function getPaymentResultCode(value: string | string[] | undefined) {
  if (typeof value !== "string") {
    return undefined;
  }

  return PAYMENT_STATUS_MESSAGE_CODE[value];
}
