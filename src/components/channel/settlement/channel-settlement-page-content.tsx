// 채널 정산 내역 페이지의 서버 렌더링 영역을 구성합니다.

import { DonationSettingsLoadFailedState } from "@/components/channel/donation/donation-settings-load-failed-state";
import { SettlementHistoryCard } from "@/components/channel/settlement/settlement-history-card";
import { SettlementSummaryCard } from "@/components/channel/settlement/settlement-summary-card";
import { SettingsPage } from "@/components/common/settings-page";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChannelDonationSnapshot, SettlementYearSummary } from "@/types/channel/donation";

interface Props {
  initialSnapshot: ChannelDonationSnapshot | null;
  yearlySummary: SettlementYearSummary[];
}

export function ChannelSettlementPageContent({ initialSnapshot, yearlySummary }: Props) {
  if (!initialSnapshot) {
    return <DonationSettingsLoadFailedState />;
  }

  return (
    <SettingsPage
      kicker="후원 정산 관리"
      title="정산 내역을 확인해요"
      description="이번 달 정산 예정액과 연도별 정산 내역을 확인해요."
      action={
        <div className="flex items-center gap-2.5">
          <span className="text-muted-foreground text-xs font-medium">(준비중)</span>
          <Button
            type="button"
            disabled
            title="실제 정산 신청은 후속 작업이에요."
            className={cn(
              "bg-brand hover:bg-brand/90 h-11 shrink-0 rounded-xl px-7 font-bold text-white",
              "shadow-brand/20 shadow-sm transition-all active:scale-95",
            )}
          >
            정산하기
          </Button>
        </div>
      }
    >
      <SettlementSummaryCard
        monthlyDonation={initialSnapshot.monthlyDonation}
        settlement={initialSnapshot.settlement}
      />
      <SettlementHistoryCard yearlySummary={yearlySummary} />
    </SettingsPage>
  );
}
