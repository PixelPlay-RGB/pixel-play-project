// 사용자 후원 지갑 화면에서 사용하는 조회 결과 타입을 정의합니다.
export const USER_DONATION_TABS = ["usage", "purchase", "free"] as const;

export const USER_DONATION_USAGE_KINDS = ["normal", "party"] as const;

export type UserDonationTab = (typeof USER_DONATION_TABS)[number];

export type UserDonationUsageKind = (typeof USER_DONATION_USAGE_KINDS)[number];

export interface UserDonationPeriod {
  year: number;
  month: number;
}

export interface UserDonationFilter {
  tab: UserDonationTab;
  usageKind: UserDonationUsageKind;
  period: UserDonationPeriod;
}

export interface UserDonationSummary {
  balanceAmount: number;
  monthlyUsageAmount: number;
  monthlyPurchaseAmount: number;
  monthlyFreeAmount: number;
}

export interface UserDonationUsageHistoryItem {
  id: string;
  usedAt: string;
  amount: number;
  content: string;
  channelName: string;
  message: string;
}

export interface UserDonationPurchaseHistoryItem {
  id: string;
  purchasedAt: string;
  amount: number;
  content: string;
  status: "pending" | "succeeded" | "failed" | "canceled";
  orderId: string | null;
}

export interface UserDonationFreeGrantHistoryItem {
  id: string;
  grantedAt: string;
  amount: number;
  content: string;
  reason: string;
}

export interface UserDonationSnapshot {
  filter: UserDonationFilter;
  summary: UserDonationSummary;
  usageHistories: UserDonationUsageHistoryItem[];
  purchaseHistories: UserDonationPurchaseHistoryItem[];
  freeGrantHistories: UserDonationFreeGrantHistoryItem[];
}
