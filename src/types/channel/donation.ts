// 채널 후원 설정 화면에서 사용하는 타입을 정의합니다.

// 저장 가능한(편집 대상) 후원 설정 값입니다.
export interface DonationSettings {
  donationEnabled: boolean;
  donationMinAmount: number;
  donationAmountVisible: boolean;
  donationAlertEnabled: boolean;
  donationAlertDurationSeconds: number;
  alertSoundEnabled: boolean;
  alertVolume: number;
  ttsEnabled: boolean;
  ttsRate: number;
}

// 정산 데모 정보(읽기 전용 표시값)입니다.
export interface DonationSettlementDemo {
  status: string;
  totalAmount: number;
  bankName: string;
  accountHolder: string;
}

export interface MonthlyDonationStat {
  amountTotal: number;
  donationCount: number;
}

export interface RecentDonationItem {
  id: string;
  donorNickname: string;
  amount: number;
  message: string;
  createdAt: string;
}

// 정산 상태: 마감되어 지급 완료된 후원 / 이번 달이라 아직 지급 전인 후원.
export type SettlementStatus = "completed" | "scheduled";

// 정산 상세 내역의 개별 후원 항목(정산 상태 포함)입니다.
export interface SettlementDonationItem extends RecentDonationItem {
  status: SettlementStatus;
}

// 정산 내역 페이지의 후원 조회 결과(페이지네이션 포함)입니다.
export interface SettlementDonationsResult {
  items: SettlementDonationItem[];
  totalCount: number;
}

// 연도별 총 정산액 요약 항목입니다.
export interface SettlementYearSummary {
  year: number;
  donationTotal: number;
  donationCount: number;
}

export interface ChannelDonationSnapshot {
  creatorId: string;
  settings: DonationSettings;
  settlement: DonationSettlementDemo;
  monthlyDonation: MonthlyDonationStat;
  recentDonations: RecentDonationItem[];
}
