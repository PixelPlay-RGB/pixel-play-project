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

export interface ChannelDonationSnapshot {
  creatorId: string;
  settings: DonationSettings;
  settlement: DonationSettlementDemo;
  monthlyDonation: MonthlyDonationStat;
  recentDonations: RecentDonationItem[];
}
