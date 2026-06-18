// 방송 운영 빠른 설정 아래에 현재 방송 후원 로그를 표시합니다.
"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Coins } from "lucide-react";

import type { ChannelLiveRecentDonation } from "@/actions/channel/live";
import { Button } from "@/components/ui/button";
import { useChannelLiveDonationFeed } from "@/hooks/channel/use-channel-live-donation-feed";
import { cn } from "@/lib/utils";
import { formatPoint } from "@/utils/channel/donation-format";
import { formatNumber } from "@/utils/common/format";

const DONATION_FEED_PAGE_SIZE = 5;
const KST_MONTH_DAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Seoul",
  month: "2-digit",
  day: "2-digit",
});

function formatDonationMonthDay(at: string) {
  return KST_MONTH_DAY_FORMATTER.format(new Date(at)).replaceAll("/", ".");
}

interface Props {
  broadcastId: string | null;
  initialDonations: ChannelLiveRecentDonation[];
}

export function ChannelLiveDonationFeedPanel({ broadcastId, initialDonations }: Props) {
  const donations = useChannelLiveDonationFeed(broadcastId, initialDonations);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(donations.length / DONATION_FEED_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageDonations = useMemo(
    () =>
      donations.slice(
        (currentPage - 1) * DONATION_FEED_PAGE_SIZE,
        currentPage * DONATION_FEED_PAGE_SIZE,
      ),
    [currentPage, donations],
  );

  const isEmpty = donations.length === 0;

  return (
    <section className="bg-card text-card-foreground flex min-h-0 flex-1 flex-col">
      <div className="border-border flex h-[var(--app-header-height)] shrink-0 items-center justify-between gap-2 border-b px-4">
        <h2 className="font-heading text-base leading-snug font-medium">이번 방송 후원</h2>
        {broadcastId && !isEmpty ? (
          <span className="text-muted-foreground text-xs font-semibold">
            총 {formatNumber(donations.length)}건
          </span>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-4 py-4">
        {!broadcastId ? (
          <DonationFeedEmptyState
            title="방송 대기 중"
            description="방송을 시작하면 후원이 쌓여요."
          />
        ) : isEmpty ? (
          <DonationFeedEmptyState
            title="아직 받은 후원이 없어요"
            description="이번 방송 후원만 여기에 표시돼요."
          />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col justify-between gap-2">
            <ul className="flex flex-col gap-1.5">
              {pageDonations.map((donation) => (
                <li
                  key={donation.id}
                  className="grid min-h-8 grid-cols-[2.6rem_minmax(0,1fr)_auto] items-center gap-2 px-1 text-xs"
                >
                  <span className="text-muted-foreground font-mono text-[0.7rem] font-semibold tabular-nums">
                    {formatDonationMonthDay(donation.createdAt)}
                  </span>
                  <span className="text-foreground min-w-0 truncate font-semibold">
                    {donation.donorNickname}
                  </span>
                  <span className="text-live min-w-16 text-right font-bold tabular-nums">
                    {formatPoint(donation.amount)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between gap-2 px-1 pt-1">
              <span className="text-muted-foreground text-xs font-semibold">최근순</span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  aria-label="이전 후원 페이지"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className={cn(
                    "text-muted-foreground hover:text-foreground",
                    currentPage <= 1 && "opacity-40",
                  )}
                >
                  <ChevronLeft className="size-3" />
                </Button>
                <span className="text-muted-foreground min-w-10 text-center text-xs font-semibold tabular-nums">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  aria-label="다음 후원 페이지"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  className={cn(
                    "text-muted-foreground hover:text-foreground",
                    currentPage >= totalPages && "opacity-40",
                  )}
                >
                  <ChevronRight className="size-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function DonationFeedEmptyState({ description, title }: { description: string; title: string }) {
  return (
    <div className="flex min-h-52 flex-1 flex-col items-center justify-center px-4 py-8 text-center">
      <Coins className="text-live mb-2 size-5" />
      <p className="text-foreground text-sm font-bold">{title}</p>
      <p className="text-muted-foreground mt-1 text-xs leading-5">{description}</p>
    </div>
  );
}
