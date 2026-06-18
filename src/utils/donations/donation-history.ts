// 후원 지갑 내역 테이블의 React 비의존 로직(아이템 빌더·그룹화·기간 옵션)을 제공합니다.
import type {
  UserDonationSnapshot,
  UserSentDonationItem,
  UserSubscriptionSpendHistoryItem,
  UserWalletChargeHistoryItem,
} from "@/types/donations/user-donations";

export type DonationHistoryTab = "all" | "charge" | "donation";

export type DonationHistoryItem = {
  kind: "charge" | "donation";
  id: string;
  title: string;
  description: string;
  amount: number;
  createdAt: string;
};

export const DONATION_HISTORY_TABS: Array<{ value: DonationHistoryTab; label: string }> = [
  { value: "all", label: "전체" },
  { value: "charge", label: "충전" },
  { value: "donation", label: "후원" },
];

export const HISTORY_ITEMS_PER_PAGE = 9;

export function buildHistoryItems(snapshot: UserDonationSnapshot): DonationHistoryItem[] {
  const chargeItems = getSucceededChargeHistories(snapshot).map(readChargeHistoryItem);
  const donationItems = snapshot.sentDonations.map(readSentDonationItem);
  const subscriptionItems =
    getSucceededSubscriptionSpendHistories(snapshot).map(readSubscriptionSpendItem);

  return [...chargeItems, ...donationItems, ...subscriptionItems].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export function getSucceededChargeHistories(snapshot: UserDonationSnapshot) {
  return snapshot.chargeHistories.filter((charge) => charge.status === "succeeded");
}

export function getSucceededSubscriptionSpendHistories(snapshot: UserDonationSnapshot) {
  return snapshot.subscriptionSpendHistories.filter(
    (subscription) => subscription.status === "succeeded",
  );
}

export function buildYearOptions(selectedYear: number) {
  const currentYear = Number(
    new Intl.DateTimeFormat("en", {
      timeZone: "Asia/Seoul",
      year: "numeric",
    }).format(new Date()),
  );
  const years = Array.from({ length: 5 }, (_, index) => currentYear - index);

  if (!years.includes(selectedYear)) {
    years.push(selectedYear);
  }

  return years.sort((left, right) => right - left);
}

export function buildMonthOptions() {
  return Array.from({ length: 12 }, (_, index) => index + 1);
}

function readChargeHistoryItem(charge: UserWalletChargeHistoryItem): DonationHistoryItem {
  return {
    kind: "charge",
    id: charge.id,
    title: "후원금 충전",
    description: "Toss Payments 승인 완료",
    amount: charge.amount,
    createdAt: charge.createdAt,
  };
}

function readSentDonationItem(donation: UserSentDonationItem): DonationHistoryItem {
  return {
    kind: "donation",
    id: donation.id,
    title: `${donation.creatorNickname} 방송 후원`,
    description: donation.message || "방송 후원을 보냈습니다.",
    amount: donation.amount,
    createdAt: donation.createdAt,
  };
}

function readSubscriptionSpendItem(
  subscription: UserSubscriptionSpendHistoryItem,
): DonationHistoryItem {
  return {
    kind: "donation",
    id: subscription.id,
    title: `${subscription.creatorNickname} 채널 구독`,
    description: "정기구독 포인트 결제",
    amount: subscription.amount,
    createdAt: subscription.createdAt,
  };
}
