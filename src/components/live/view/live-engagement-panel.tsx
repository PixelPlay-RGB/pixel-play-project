// 후원 내역 리스트와 투표 리스트를 50/50 행으로 렌더링합니다.

import { LiveDonationList } from "@/components/live/view/live-donation-list";
import { LivePollList } from "@/components/live/view/live-poll-list";
import type { LiveDonation, LivePoll } from "@/types/live/live";

interface Props {
  donations: LiveDonation[];
  polls: LivePoll[];
}

export function LiveEngagementPanel({ donations, polls }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <LiveDonationList donations={donations} />
      <LivePollList polls={polls} />
    </div>
  );
}
