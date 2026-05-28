// 진행 중 투표 리스트를 렌더링합니다.

import { LIVE_LABEL, LIVE_VOTE_LABEL } from "@/constants/live/live";
import { cn } from "@/lib/utils";
import type { LivePoll } from "@/types/live/live";

interface Props {
  polls: LivePoll[];
}

export function LivePollList({ polls }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-foreground text-sm font-semibold">{LIVE_LABEL.pollList}</h2>

      {polls.length === 0 ? (
        <p className="text-muted-foreground text-xs">{LIVE_LABEL.emptyPoll}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {polls.map((poll) => (
            <li key={poll.id} className="border-border bg-card rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-foreground text-sm font-medium">{poll.title}</span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                    poll.status === "active"
                      ? "bg-live/10 text-live"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {poll.status === "active" ? "진행 중" : LIVE_VOTE_LABEL.ended}
                </span>
              </div>
              <ul className="flex flex-col gap-1">
                {poll.options.map((option) => {
                  const pct =
                    poll.totalCount > 0 ? Math.round((option.count / poll.totalCount) * 100) : 0;
                  return (
                    <li key={option.id} className="text-muted-foreground text-xs">
                      <div className="mb-0.5 flex items-center justify-between">
                        <span>{option.label}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                        <div
                          className="bg-brand h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="text-muted-foreground mt-2 text-right text-xs">
                {poll.totalCount.toLocaleString()}
                {LIVE_VOTE_LABEL.totalCount}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
