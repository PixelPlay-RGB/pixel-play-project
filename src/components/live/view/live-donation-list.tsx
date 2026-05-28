// 최근 후원 내역 리스트를 렌더링합니다.

import { LIVE_LABEL } from "@/constants/live/live";
import { formatDonationAmount } from "@/utils/live/live-chat";
import type { LiveDonation } from "@/types/live/live";

interface Props {
  donations: LiveDonation[];
}

export function LiveDonationList({ donations }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-foreground text-sm font-semibold">{LIVE_LABEL.donationList}</h2>

      {donations.length === 0 ? (
        <p className="text-muted-foreground text-xs">{LIVE_LABEL.emptyDonation}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {donations.map((donation) => (
            <li key={donation.id} className="border-live/20 bg-live/5 rounded-lg border px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-foreground text-xs font-medium">{donation.author}</span>
                <span className="text-live text-xs font-semibold">
                  {formatDonationAmount(donation.amount)}P
                </span>
              </div>
              {donation.message ? (
                <p className="text-muted-foreground mt-1 text-xs">{donation.message}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
