// 채널 정산 내역 페이지의 서버 렌더링 영역을 구성합니다.

import { CalendarCheck } from "lucide-react";

import { LoadFailedState } from "@/components/common/load-failed-state";
import { SettlementHistoryCard } from "@/components/channel/settlement/settlement-history-card";
import { SettlementSummaryCard } from "@/components/channel/settlement/settlement-summary-card";
import { HintNote } from "@/components/common/hint-note";
import { SettingsPage } from "@/components/common/settings-page";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { SETTLEMENT_PAYOUT_DAY } from "@/constants/channel/donation";
import type { ChannelDonationSnapshot, SettlementYearSummary } from "@/types/channel/donation";

interface Props {
  initialSnapshot: ChannelDonationSnapshot | null;
  yearlySummary: SettlementYearSummary[];
}

export function ChannelSettlementPageContent({ initialSnapshot, yearlySummary }: Props) {
  if (!initialSnapshot) {
    return <LoadFailedState code={APP_MESSAGE_CODE.error.channel.donationSettingsLoadFailed} />;
  }

  return (
    <SettingsPage
      kicker="후원 정산 관리"
      title="정산 내역을 확인해요"
      description="이번 달 정산 예정액과 연도별 정산 내역을 확인해요."
    >
      {/* 자동 정산 안내 */}
      <HintNote icon={CalendarCheck}>
        정산은 매월 {SETTLEMENT_PAYOUT_DAY}일에 자동으로 처리돼요. 전월 채팅 후원 합계에서
        수수료(10%)를 제외한 금액이 등록된 정산 계좌로 자동 지급되며, 별도의 정산 신청은 필요하지
        않아요.
      </HintNote>

      <SettlementSummaryCard
        monthlyDonation={initialSnapshot.monthlyDonation}
        settlement={initialSnapshot.settlement}
      />
      <SettlementHistoryCard yearlySummary={yearlySummary} />
    </SettingsPage>
  );
}
