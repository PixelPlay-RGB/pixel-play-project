// 채널 후원 설정 화면의 서버 렌더링 영역을 구성합니다.

import { ChannelDonationControls } from "@/components/channel/donation/channel-donation-controls";
import { LoadFailedState } from "@/components/common/load-failed-state";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type { ChannelDonationSnapshot } from "@/types/channel/donation";

interface Props {
  initialSnapshot: ChannelDonationSnapshot | null;
}

export function ChannelDonationPageContent({ initialSnapshot }: Props) {
  if (!initialSnapshot) {
    return <LoadFailedState code={APP_MESSAGE_CODE.error.channel.donationSettingsLoadFailed} />;
  }

  return <ChannelDonationControls initialSnapshot={initialSnapshot} />;
}
