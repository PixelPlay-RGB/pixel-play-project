// 사용자 후원 지갑 화면에서 사용하는 조회 결과 타입을 정의합니다.
import type { Database } from "@/types/database.types";

export type WalletTransactionType = Database["public"]["Enums"]["wallet_transaction_type"];
export type WalletTransactionStatus = Database["public"]["Enums"]["wallet_transaction_status"];

export interface UserDonationSummary {
  balanceAmount: number;
  sentDonationAmount: number;
  chargeAmount: number;
  transactionCount: number;
}

export interface UserSentDonationItem {
  id: string;
  broadcastId: string;
  creatorId: string;
  creatorNickname: string;
  amount: number;
  message: string;
  createdAt: string;
}

export interface UserWalletTransactionItem {
  id: string;
  type: WalletTransactionType;
  status: WalletTransactionStatus;
  amountDelta: number;
  balanceAfter: number | null;
  createdAt: string;
}

export interface UserDonationSnapshot {
  paymentCustomerKey: string;
  summary: UserDonationSummary;
  sentDonations: UserSentDonationItem[];
  transactions: UserWalletTransactionItem[];
}
