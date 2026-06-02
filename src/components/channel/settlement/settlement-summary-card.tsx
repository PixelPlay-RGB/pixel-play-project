// 이번 달 정산 예정액과 요약 내역, 지급 상태를 보여줍니다.

import { CalendarClock, Landmark } from "lucide-react";

import { SettingsCard } from "@/components/common/settings-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DonationSettlementDemo, MonthlyDonationStat } from "@/types/channel/donation";
import { calcSettlement, formatNextPayoutDate, formatPoint } from "@/utils/channel/donation-format";

interface Props {
  monthlyDonation: MonthlyDonationStat;
  settlement: DonationSettlementDemo;
}

export function SettlementSummaryCard({ monthlyDonation, settlement }: Props) {
  const donationTotal = monthlyDonation.amountTotal;
  const { fee, payable } = calcSettlement(donationTotal);
  const hasDonation = monthlyDonation.donationCount > 0;
  const payoutDate = formatNextPayoutDate();

  // 이번 달분은 아직 마감 전이므로 후원이 있으면 '정산 예정', 없으면 '정산 대상 없음'으로 표시합니다.
  const statusBadge = hasDonation
    ? { label: "정산 예정", className: "bg-amber-400/15 text-amber-600 dark:text-amber-400" }
    : { label: "정산 대상 없음", className: "bg-muted text-muted-foreground" };

  const hasAccount = settlement.bankName.length > 0 && settlement.accountHolder.length > 0;
  const accountLabel = hasAccount
    ? `${settlement.bankName} · ${settlement.accountHolder}`
    : "미등록";

  const breakdown = [
    { label: "이번 달 후원액", value: formatPoint(donationTotal) },
    { label: "수수료 (10%)", value: `-${formatPoint(fee)}`, muted: true },
    { label: "후원 건수", value: `${monthlyDonation.donationCount}건` },
  ];

  return (
    <SettingsCard
      title="이번 달 정산"
      description="이번 달 채팅 후원 합계에서 수수료를 제외한 정산 예정액이에요."
    >
      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        {/* 정산 예정액 하이라이트 */}
        <div className="from-brand/15 via-brand/5 ring-brand/20 relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-gradient-to-br to-transparent p-6 ring-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-xs font-bold tracking-wide">
              총 정산 예정액
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
                statusBadge.className,
              )}
            >
              <span className="size-1.5 rounded-full bg-current" aria-hidden />
              {statusBadge.label}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-brand text-[2.75rem] leading-none font-black tracking-tight tabular-nums">
              {formatPoint(payable)}
            </p>
            <p className="text-muted-foreground text-xs leading-5">
              채팅 후원 {formatPoint(donationTotal)}에서 수수료(10%)를 제외한 금액이에요.
            </p>
          </div>

          <dl className="border-brand/15 mt-auto grid gap-2.5 border-t pt-4 text-sm">
            <div className="flex items-center gap-2">
              <CalendarClock className="text-brand size-4 shrink-0" aria-hidden />
              <dt className="text-muted-foreground text-xs">지급 예정일</dt>
              <dd className="text-foreground ml-auto font-bold">{payoutDate}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Landmark className="text-brand size-4 shrink-0" aria-hidden />
              <dt className="text-muted-foreground text-xs">정산 계좌</dt>
              <dd
                className={cn(
                  "ml-auto truncate font-bold",
                  hasAccount ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {accountLabel}
              </dd>
            </div>
          </dl>
        </div>

        {/* 정산 상세 내역(영수증형) */}
        <div className="border-border/60 bg-muted/15 flex flex-col rounded-2xl border p-6">
          <span className="text-foreground text-sm font-bold">정산 내역</span>

          <dl className="mt-4 flex flex-col">
            {breakdown.map((row) => (
              <div
                key={row.label}
                className="border-border/50 flex items-center justify-between border-b py-3 text-sm first:pt-0"
              >
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd
                  className={cn(
                    "font-bold tabular-nums",
                    row.muted ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {row.value}
                </dd>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3">
              <dt className="text-foreground text-sm font-bold">정산 예정액</dt>
              <dd className="text-brand text-base font-black tabular-nums">
                {formatPoint(payable)}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              disabled
              title="실제 계좌 연동은 후속 작업이에요."
              className="h-10 flex-1 rounded-xl font-semibold"
            >
              정산 정보 수정
            </Button>
            <span className="text-muted-foreground shrink-0 text-xs font-medium">(준비중)</span>
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}
