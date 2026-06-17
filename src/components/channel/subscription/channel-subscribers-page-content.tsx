"use client";
// 채널 구독자 목록의 검색·정렬 UI와 구독자 요약 배너를 렌더링합니다.

import { CalendarPlus, Search, UsersRound } from "lucide-react";
import { useRef, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SettingsCard } from "@/components/common/settings-card";
import { SettingsPage } from "@/components/common/settings-page";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type {
  ChannelSubscriberItem,
  ChannelSubscriberSort,
  ChannelSubscriptionSnapshot,
  ChannelSubscriptionStatus,
} from "@/utils/channel/channel-subscription";
import { formatKstDateTimeNumeric } from "@/utils/common/date";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";

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
  canceled: { label: "해지 예약", className: "bg-warning/15 text-warning" },
};

interface Props {
  snapshot: ChannelSubscriptionSnapshot;
  query: string;
  sort: ChannelSubscriberSort;
}

function SubscriberIdentity({ subscriber }: { subscriber: ChannelSubscriberItem }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-9 shrink-0">
        <AvatarImage src={getAvatarImageSrc(subscriber.photoUrl)} alt="" />
        <AvatarFallback>{getAvatarFallbackText(subscriber.nickname)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="text-foreground truncate font-medium">{subscriber.nickname}</p>
        <p className="text-muted-foreground truncate font-mono text-xs">
          {subscriber.subscriberId}
        </p>
      </div>
    </div>
  );
}

function SubscriptionStatusBadge({ status }: { status: ChannelSubscriptionStatus }) {
  const badge = STATUS_BADGE[status];

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap",
        badge.className,
      )}
    >
      {badge.label}
    </span>
  );
}

export function ChannelSubscribersPageContent({ snapshot, query, sort }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();
  const subscribers = snapshot.subscribers;

  const emptyMessage =
    subscribers.length === 0 && !query
      ? "아직 내 채널을 구독한 사람이 없어요."
      : "검색 조건에 맞는 구독자가 없어요.";

  function replaceSearchParams(next: { query?: string; sort?: ChannelSubscriberSort }) {
    const params = new URLSearchParams(searchParams.toString());
    const nextQuery = next.query ?? query;
    const nextSort = next.sort ?? sort;

    if (nextQuery.trim()) {
      params.set("query", nextQuery.trim());
    } else {
      params.delete("query");
    }

    if (nextSort === "started_desc") {
      params.delete("sort");
    } else {
      params.set("sort", nextSort);
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;

    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });
  }

  return (
    <SettingsPage
      kicker="구독 관리"
      title="내 채널 구독을 관리해요"
      description="구독 시작일과 누적 구독 기간을 기준으로 구독자 목록을 살펴볼 수 있어요."
    >
      <section
        className={cn(
          "side-tip-card text-card-foreground grid gap-5 rounded-xl border p-5",
          "sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-6",
        )}
      >
        <div className="flex min-w-0 items-center gap-4">
          <div className="bg-brand/10 text-brand flex size-12 shrink-0 items-center justify-center rounded-xl">
            <UsersRound className="size-6" aria-hidden />
          </div>

          <div className="min-w-0 space-y-2">
            <span className="text-brand text-sm font-extrabold">현재 활성 구독자</span>
            <strong className="text-foreground block text-4xl leading-none font-black tabular-nums">
              {snapshot.activeCount.toLocaleString("ko-KR")}명
            </strong>
          </div>
        </div>

        <div
          className={cn(
            "border-brand/15 flex items-center gap-3 border-t pt-4",
            "sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6",
          )}
        >
          <div className="bg-brand/10 text-brand flex size-9 shrink-0 items-center justify-center rounded-xl">
            <CalendarPlus className="size-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <span className="text-muted-foreground block text-xs font-bold">이번 달 신규</span>
            <strong className="text-foreground text-xl leading-tight font-black whitespace-nowrap tabular-nums">
              {snapshot.monthlyNewCount.toLocaleString("ko-KR")}명
            </strong>
          </div>
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
              key={query}
              ref={searchInputRef}
              defaultValue={query}
              onChange={(event) => {
                const nextQuery = event.target.value;
                replaceSearchParams({ query: nextQuery });
              }}
              placeholder="닉네임 검색"
              className="h-10 pl-9"
            />
          </label>

          <Select
            value={sort}
            items={SORT_OPTIONS}
            onValueChange={(nextValue) =>
              replaceSearchParams({
                query: searchInputRef.current?.value ?? query,
                sort: nextValue as ChannelSubscriberSort,
              })
            }
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
          <>
            <div className="ring-foreground/10 bg-card hidden overflow-hidden rounded-xl shadow-sm ring-1 md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead scope="col">닉네임</TableHead>
                    <TableHead scope="col" className="text-center">
                      구독 시작일
                    </TableHead>
                    <TableHead scope="col" className="text-center">
                      구독 기간
                    </TableHead>
                    <TableHead scope="col" className="text-center">
                      상태
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.map((subscriber) => (
                    <TableRow key={subscriber.id} className="hover:bg-transparent">
                      <TableCell>
                        <SubscriberIdentity subscriber={subscriber} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-center tabular-nums">
                        {formatKstDateTimeNumeric(subscriber.startedAt)}
                      </TableCell>
                      <TableCell className="text-center font-black tabular-nums">
                        {subscriber.totalMonths.toLocaleString("ko-KR")}개월
                      </TableCell>
                      <TableCell className="text-center">
                        <SubscriptionStatusBadge status={subscriber.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <ul className="flex flex-col gap-3 md:hidden">
              {subscribers.map((subscriber) => (
                <li
                  key={subscriber.id}
                  className="ring-foreground/10 bg-card flex flex-col gap-3 rounded-xl p-4 shadow-sm ring-1"
                >
                  <SubscriberIdentity subscriber={subscriber} />
                  <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <span className="tabular-nums">
                      시작 {formatKstDateTimeNumeric(subscriber.startedAt)}
                    </span>
                    <span className="text-foreground font-black tabular-nums">
                      {subscriber.totalMonths.toLocaleString("ko-KR")}개월
                    </span>
                    <SubscriptionStatusBadge status={subscriber.status} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </SettingsCard>
    </SettingsPage>
  );
}
