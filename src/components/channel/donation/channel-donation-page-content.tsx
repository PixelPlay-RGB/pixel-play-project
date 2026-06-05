// 채널 후원 설정 화면의 서버 렌더링 영역을 구성합니다.

import { ChannelDonationControls } from "@/components/channel/donation/channel-donation-controls";
import { DonationSettingsLoadFailedState } from "@/components/channel/donation/donation-settings-load-failed-state";
import type { ChannelDonationSnapshot } from "@/types/channel/donation";

interface Props {
  initialSnapshot: ChannelDonationSnapshot | null;
}

export function ChannelDonationPageContent({ initialSnapshot }: Props) {
  if (!initialSnapshot) {
    return <DonationSettingsLoadFailedState />;
  }

  return <ChannelDonationControls initialSnapshot={initialSnapshot} />;
}
