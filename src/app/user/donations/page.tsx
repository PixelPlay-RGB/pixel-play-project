// 사용자 후원 지갑 페이지를 렌더링합니다.
import { getUserDonationSnapshot } from "@/app/user/donations/_data/user-donation-data";
import { UserDonationsPage } from "@/components/donations/user-donations-page";
import type { Metadata } from "next";

interface Props {
  searchParams: Promise<{
    tab?: string | string[];
    year?: string | string[];
    month?: string | string[];
    kind?: string | string[];
  }>;
}

export const metadata: Metadata = {
  title: "후원 지갑",
  description: "PixelPlay 후원 지갑 잔액과 후원 내역을 확인합니다.",
};

export default async function UserDonationsRoutePage({ searchParams }: Props) {
  const params = await searchParams;
  const result = await getUserDonationSnapshot(params);

  return <UserDonationsPage snapshot={result.data ?? null} errorCode={result.code} />;
}
