import { Trophy } from "lucide-react";
import { formatDonationAmount } from "@/utils/live/live-chat";
import { LIVE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";
import type { LiveDonation } from "@/types/live/live";

interface Props {
  donations: LiveDonation[];
}

const RANK_META = [
  { color: "text-yellow-500", bg: "border-yellow-400/30 bg-yellow-400/5" },
  { color: "text-slate-400", bg: "border-border bg-background/80" },
  { color: "text-amber-600", bg: "border-border bg-background/80" },
] as const;

export function LiveDonationBanner({ donations }: Props) {
  const top3 = [...donations].sort((a, b) => b.amount - a.amount).slice(0, 3);

  return (
    <div className="border-border bg-card/95 shadow-xs rounded-lg border px-2.5 py-1.5 backdrop-blur-sm">
      <div className="mb-1 flex items-center gap-1">
        <Trophy className="text-muted-foreground size-2.5 shrink-0" />
        <span className="text-muted-foreground text-xs leading-none font-medium">
          {LIVE_LABEL.donationRankingTitle}
        </span>
      </div>

      {top3.length === 0 ? (
        <p className="text-muted-foreground text-xs">{LIVE_LABEL.emptyWeeklyDonation}</p>
      ) : (
        <div className="flex items-stretch gap-1.5">
          <div
            className={cn(
              "flex w-1/2 min-w-0 items-center gap-1.5 rounded-md border px-2 py-1",
              RANK_META[0].bg,
            )}
          >
            <span className={cn("shrink-0 text-xs leading-none font-bold", RANK_META[0].color)}>
              1
            </span>
            <span className="text-foreground min-w-0 flex-1 truncate text-xs font-medium">
              {top3[0]?.author ?? "-"}
            </span>
            <span className="text-live shrink-0 text-sm font-bold">
              {top3[0] ? `${formatDonationAmount(top3[0].amount)}P` : ""}
            </span>
          </div>

          <div className="flex w-1/2 min-w-0 flex-col gap-1">
            {([1, 2] as const).map((idx) => (
              <div
                key={idx}
                className={cn(
                  "flex flex-1 items-center gap-1.5 rounded-md border px-2 py-0.5",
                  RANK_META[idx].bg,
                )}
              >
                <span className={cn("shrink-0 text-xs font-bold", RANK_META[idx].color)}>
                  {idx + 1}
                </span>
                <span className="text-foreground min-w-0 flex-1 truncate text-xs">
                  {top3[idx]?.author ?? "-"}
                </span>
                <span className="text-live shrink-0 text-xs font-semibold">
                  {top3[idx] ? `${formatDonationAmount(top3[idx].amount)}P` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
