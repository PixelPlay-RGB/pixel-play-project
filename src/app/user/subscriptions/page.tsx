// 사용자의 방송인 구독 목록과 관리 화면을 렌더링합니다.
import { getUserSubscriptionSnapshot } from "@/app/user/subscriptions/_data/user-subscription-data";
import { UserSubscriptionsPage } from "@/components/subscriptions/user-subscriptions-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "구독",
  description: "PixelPlay에서 내가 구독 중인 방송인과 구독 혜택을 확인합니다.",
};

export default async function UserSubscriptionsRoutePage() {
  const result = await getUserSubscriptionSnapshot();

  return <UserSubscriptionsPage snapshot={result.data ?? null} errorCode={result.code} />;
}
