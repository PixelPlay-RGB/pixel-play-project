// 후원 금액·날짜 표시용 포맷 헬퍼를 제공합니다.

import { DONATION_SETTLEMENT_FEE_RATE, SETTLEMENT_PAYOUT_DAY } from "@/constants/channel/donation";
import { addKstMonths, getKstDateParts, KST_TIME_ZONE } from "@/utils/common/kst";
import { formatPoint } from "@/utils/donations/format";

// formatPoint 단일 진실원천은 utils/donations/format. 채널 도메인 호출부 호환을 위해 재노출한다.
export { formatPoint };

const FULL_DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: KST_TIME_ZONE,
  month: "long",
  day: "numeric",
});

// 후원 합계에서 수수료를 제외한 정산 금액을 계산합니다.
export function calcSettlement(donationTotal: number): { fee: number; payable: number } {
  const fee = Math.floor(donationTotal * DONATION_SETTLEMENT_FEE_RATE);
  return { fee, payable: donationTotal - fee };
}

// 후원일을 "5월 28일" 형태의 전체 날짜로 표시합니다.
export function formatDonationFullDate(iso: string): string {
  const time = new Date(iso).getTime();

  if (!Number.isFinite(time)) {
    return "";
  }

  return FULL_DATE_FORMATTER.format(time);
}

// 이번 달 후원분의 지급 예정일(다음 달 N일)을 KST 기준 "2026년 7월 10일" 형태로 표시합니다.
export function formatNextPayoutDate(base: Date = new Date()): string {
  const { year, month } = getKstDateParts(base);
  const payout = addKstMonths(year, month, 1);
  return `${payout.year}년 ${payout.month}월 ${SETTLEMENT_PAYOUT_DAY}일`;
}
