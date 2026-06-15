"use client";
// 채널 구독자 목록의 검색·정렬 UI와 구독자 요약 배너를 렌더링합니다.

import { Search, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";

import { SettingsCard } from "@/components/common/settings-card";
import { SettingsPage } from "@/components/common/settings-page";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectList,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  ChannelSubscriberSort,
  ChannelSubscriptionSnapshot,
  ChannelSubscriptionStatus,
} from "@/utils/channel/channel-subscription";
import { filterAndSortChannelSubscribers } from "@/utils/channel/channel-subscription";
import { formatKstDateTimeNumeric } from "@/utils/common/date";

const SORT_OPTIONS: { value: ChannelSubscriberSort; label: string }[] = [
  { value: "started_desc", label: "최근 시작순" },
  { value: "started_asc", label: "오래된 시작순" },
  { value: "months_desc", label: "기간 긴 순" },
  { value: "months_asc", label: "기간 짧은 순" },
  { value: "nickname_asc", label: "닉네임순" },
];

const STATUS_BADGE: Record<ChannelSubscriptionStatus, { label: string; className: string }> = {
  active: { label: "구독중", className: "bg-brand/15 text-brand" },
  expired: { label: "만료", className: "bg-muted text-muted-foreground" },
  canceled: { label: "취소", className: "bg-destructive/10 text-destructive" },
};

const TH_CLASS = "text-muted-foreground px-4 py-3 text-xs font-semibold";
const TD_CLASS = "px-4 py-3.5 align-middle";

interface Props {
  snapshot: ChannelSubscriptionSnapshot;
}

export function ChannelSubscribersPageContent({ snapshot }: Props) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ChannelSubscriberSort>("started_desc");

  const subscribers = useMemo(
    () => filterAndSortChannelSubscribers(snapshot.subscribers, { query, sort }),
    [snapshot.subscribers, query, sort],
  );

  const totalHistoryCount = snapshot.subscribers.length;
  const emptyMessage =
    totalHistoryCount === 0
      ? "아직 내 채널을 구독한 사람이 없어요."
      : "검색 조건에 맞는 구독자가 없어요.";

  return (
    <SettingsPage
      kicker="구독자 관리"
      title="내 채널 구독자를 확인해요"
      description="구독 시작일과 누적 구독 기간을 기준으로 구독자 목록을 살펴볼 수 있어요."
    >
      <section className="border-border bg-card flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-sm font-bold">현재 활성 구독자</span>
          <strong className="text-foreground text-4xl leading-none font-black tabular-nums">
            {snapshot.activeCount.toLocaleString("ko-KR")}명
          </strong>
        </div>

        <div className="bg-muted/60 text-muted-foreground flex w-fit items-center gap-2 rounded-full px-3 py-2 text-sm font-bold">
          <UsersRound className="size-4" />
          <span>총 구독 이력 {totalHistoryCount.toLocaleString("ko-KR")}건</span>
        </div>
      </section>

      <SettingsCard
        title="구독자 목록"
        description="닉네임으로 찾거나 구독 시작일·구독 기간 기준으로 정렬할 수 있어요."
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative w-full sm:max-w-80">
            <span className="sr-only">닉네임 검색</span>
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="닉네임 검색"
              className="h-10 pl-9"
            />
          </label>

          <Select
            value={sort}
            items={SORT_OPTIONS}
            onValueChange={(nextValue) => setSort(nextValue as ChannelSubscriberSort)}
          >
            <SelectTrigger aria-label="구독자 정렬 기준" className="h-10 w-full sm:w-40">
              <SelectValue />
              <SelectIcon />
            </SelectTrigger>
            <SelectContent>
              <SelectList>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} label={option.label}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectList>
            </SelectContent>
          </Select>
        </div>

        {subscribers.length === 0 ? (
          <div className="ring-foreground/10 rounded-xl py-12 text-center ring-1">
            <p className="text-muted-foreground text-sm">{emptyMessage}</p>
          </div>
        ) : (
          <div className="ring-foreground/10 overflow-hidden rounded-xl ring-1">
            <div className="overflow-x-auto">
              <table className="w-full min-w-160 text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className={cn(TH_CLASS, "text-left")}>닉네임</th>
                    <th className={cn(TH_CLASS, "text-right")}>구독 시작일</th>
                    <th className={cn(TH_CLASS, "text-right")}>구독 기간</th>
                    <th className={cn(TH_CLASS, "text-right")}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((subscriber) => {
                    const badge = STATUS_BADGE[subscriber.status];

                    return (
                      <tr key={subscriber.id} className="border-border/60 border-t">
                        <td className={cn(TD_CLASS, "max-w-0 truncate font-bold")}>
                          {subscriber.nickname}
                        </td>
                        <td
                          className={cn(
                            TD_CLASS,
                            "text-muted-foreground text-right whitespace-nowrap",
                          )}
                        >
                          {formatKstDateTimeNumeric(subscriber.startedAt)}
                        </td>
                        <td
                          className={cn(
                            TD_CLASS,
                            "text-right font-black whitespace-nowrap tabular-nums",
                          )}
                        >
                          {subscriber.totalMonths.toLocaleString("ko-KR")}개월
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
          </div>
        )}
      </SettingsCard>
    </SettingsPage>
  );
}
