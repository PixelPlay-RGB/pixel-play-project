// 최근 받은 후원 내역을 카드로 보여줍니다.

import { SettingsCard } from "@/components/common/settings-card";
import type { RecentDonationItem } from "@/types/channel/donation";
import { formatDonationDate, formatPoint } from "@/utils/channel/donation-format";

interface Props {
  items: RecentDonationItem[];
}

export default function DonationRecentList({ items }: Props) {
  return (
    <SettingsCard title="최근 후원" description="최근 받은 후원 내역이에요.">
      {items.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">아직 후원 내역이 없어요.</p>
      ) : (
        <ul className="flex flex-col">
          {items.map((item) => (
            <li
              key={item.id}
              className="border-border/70 flex flex-col gap-1 border-t py-3 first:border-t-0 first:pt-0 last:pb-0"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-foreground min-w-0 truncate text-sm font-bold">
                  {item.donorNickname}
                </span>
                <span className="text-brand shrink-0 text-sm font-black tabular-nums">
                  {formatPoint(item.amount)}
                </span>
              </div>
              {item.message && (
                <p className="text-muted-foreground line-clamp-2 text-xs leading-5">
                  {item.message}
                </p>
              )}
              <span className="text-muted-foreground/70 text-[11px]">
                {formatDonationDate(item.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SettingsCard>
  );
}
