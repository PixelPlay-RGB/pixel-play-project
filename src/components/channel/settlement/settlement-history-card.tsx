"use client";
// 정산 상세 내역을 연도/상태/정렬 필터 + 페이지네이션으로 보여줍니다.
// 상단에는 선택한 연도의 총 정산액 요약을 함께 노출합니다.

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getSettlementDonationsAction } from "@/actions/channel/settlement";
import ChatRoomListPagination from "@/components/chat-room-list/chat-room-list-pagination";
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { SettingsCard } from "@/components/common/settings-card";
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectList,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  SETTLEMENT_PAGE_SIZE,
  SETTLEMENT_SORT_OPTIONS,
  SETTLEMENT_STATUS_OPTIONS,
  type SettlementSortOption,
  type SettlementStatusFilter,
} from "@/constants/channel/donation";
import { cn } from "@/lib/utils";
import type { SettlementStatus, SettlementYearSummary } from "@/types/channel/donation";
import {
  calcSettlement,
  formatDonationFullDate,
  formatPoint,
} from "@/utils/channel/donation-format";

const TH_CLASS = "text-muted-foreground px-4 py-3 text-xs font-semibold";
const TD_CLASS = "px-4 py-3.5 align-middle";

const STATUS_BADGE: Record<SettlementStatus, { label: string; className: string }> = {
  completed: { label: "정산 완료", className: "bg-brand/15 text-brand" },
  scheduled: {
    label: "정산 예정",
    className: "bg-amber-400/15 text-amber-600 dark:text-amber-400",
  },
};

interface Props {
  yearlySummary: SettlementYearSummary[];
}

export function SettlementHistoryCard({ yearlySummary }: Props) {
  const summaryByYear = new Map(yearlySummary.map((item) => [item.year, item]));
  const yearOptions =
    yearlySummary.length > 0 ? yearlySummary.map((item) => item.year) : [new Date().getFullYear()];
  const yearItems = yearOptions.map((option) => ({ value: String(option), label: `${option}년` }));

  const [year, setYear] = useState(yearOptions[0]);
  const [status, setStatus] = useState<SettlementStatusFilter>("all");
  const [sort, setSort] = useState<SettlementSortOption>("latest");
  const [page, setPage] = useState(1);

  const { data, isFetching } = useQuery({
    queryKey: QUERY_KEYS.settlement.donations(year, status, sort, page),
    queryFn: () => getSettlementDonationsAction({ year, status, sort, page }),
    placeholderData: (previous) => previous,
  });

  const result = data?.success ? data.data : null;
  const items = result?.items ?? [];
  const totalCount = result?.totalCount ?? 0;
  const totalPages = Math.max(Math.ceil(totalCount / SETTLEMENT_PAGE_SIZE), 1);
  const isInitialLoading = isFetching && !result;

  const yearSummary = summaryByYear.get(year);
  const donationTotal = yearSummary?.donationTotal ?? 0;
  const donationCount = yearSummary?.donationCount ?? 0;
  const { fee, payable } = calcSettlement(donationTotal);

  const resetPage = () => setPage(1);

  const handleYearChange = (nextYear: number) => {
    setYear(nextYear);
    resetPage();
  };

  const handleStatusChange = (nextStatus: string) => {
    setStatus(nextStatus as SettlementStatusFilter);
    resetPage();
  };

  const handleSortChange = (nextSort: string) => {
    setSort(nextSort as SettlementSortOption);
    resetPage();
  };

  return (
    <SettingsCard title="상세 내역" description="후원별 정산 상태를 연도·정렬 기준으로 확인해요.">
      {/* 선택 연도 총 정산액 요약 + 연도 선택 */}
      <div className="from-brand/10 to-live/10 ring-brand/15 flex flex-col gap-4 rounded-2xl bg-gradient-to-br p-5 ring-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Select
            value={String(year)}
            items={yearItems}
            onValueChange={(nextValue) => handleYearChange(Number(nextValue))}
          >
            <SelectTrigger aria-label="조회 연도 선택" className="bg-background/70 w-32">
              <SelectValue />
              <SelectIcon />
            </SelectTrigger>
            <SelectContent>
              <SelectList>
                {yearItems.map((option) => (
                  <SelectItem key={option.value} value={option.value} label={option.label}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectList>
            </SelectContent>
          </Select>

          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-xs font-bold">{year}년 총 정산액</span>
            <p className="text-brand text-3xl leading-none font-black tabular-nums">
              {formatPoint(payable)}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-x-6 gap-y-1 sm:flex sm:flex-col sm:items-end sm:gap-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <dt className="text-muted-foreground text-xs">총 후원액</dt>
            <dd className="text-foreground text-sm font-bold tabular-nums">
              {formatPoint(donationTotal)}
            </dd>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <dt className="text-muted-foreground text-xs">수수료 (10%)</dt>
            <dd className="text-muted-foreground text-sm font-bold tabular-nums">
              -{formatPoint(fee)}
            </dd>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <dt className="text-muted-foreground text-xs">후원 건수</dt>
            <dd className="text-foreground text-sm font-bold tabular-nums">{donationCount}건</dd>
          </div>
        </dl>
      </div>

      {/* 상태 / 정렬 필터 */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Select
          value={status}
          items={SETTLEMENT_STATUS_OPTIONS}
          onValueChange={(nextValue) => handleStatusChange(nextValue as string)}
        >
          <SelectTrigger aria-label="정산 상태 필터" className="w-32">
            <SelectValue />
            <SelectIcon />
          </SelectTrigger>
          <SelectContent>
            <SelectList>
              {SETTLEMENT_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} label={option.label}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectList>
          </SelectContent>
        </Select>

        <Select
          value={sort}
          items={SETTLEMENT_SORT_OPTIONS}
          onValueChange={(nextValue) => handleSortChange(nextValue as string)}
        >
          <SelectTrigger aria-label="정렬 기준" className="w-28">
            <SelectValue />
            <SelectIcon />
          </SelectTrigger>
          <SelectContent>
            <SelectList>
              {SETTLEMENT_SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} label={option.label}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectList>
          </SelectContent>
        </Select>
      </div>

      {isInitialLoading ? (
        <div className="ring-foreground/10 flex items-center justify-center rounded-xl py-12 ring-1">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <div className="ring-foreground/10 rounded-xl ring-1">
          <p className="text-muted-foreground py-12 text-center text-sm">
            조건에 맞는 후원 내역이 없어요.
          </p>
        </div>
      ) : (
        <div
          className={cn(
            "ring-foreground/10 overflow-hidden rounded-xl ring-1 transition-opacity",
            isFetching && "opacity-60",
          )}
        >
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className={cn(TH_CLASS, "text-left")}>닉네임</th>
                <th className={cn(TH_CLASS, "text-right")}>후원일</th>
                <th className={cn(TH_CLASS, "text-right")}>후원 금액</th>
                <th className={cn(TH_CLASS, "text-right")}>정산 상태</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const badge = STATUS_BADGE[item.status];

                return (
                  <tr key={item.id} className="border-border/60 border-t">
                    <td className={cn(TD_CLASS, "max-w-0 truncate font-bold")}>
                      {item.donorNickname}
                    </td>
                    <td
                      className={cn(TD_CLASS, "text-muted-foreground text-right whitespace-nowrap")}
                    >
                      {formatDonationFullDate(item.createdAt)}
                    </td>
                    <td
                      className={cn(
                        TD_CLASS,
                        "text-right font-black whitespace-nowrap tabular-nums",
                      )}
                    >
                      {formatPoint(item.amount)}
                    </td>
                    <td className={cn(TD_CLASS, "text-right")}>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap",
                          badge.className,
                        )}
                      >
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ChatRoomListPagination
        currentPage={page}
        totalPages={totalPages}
        isFetching={isFetching}
        onPageChange={setPage}
      />
    </SettingsCard>
  );
}
