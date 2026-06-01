// 크리에이터 후원 설정 페이지를 렌더링합니다.
import { getChannelLiveStudioSnapshotAction } from "@/actions/channel/live";
import ChannelDonationSettingsPage from "@/components/channel/donation/channel-donation-settings-page";

export default async function ChannelDonationPage() {
  const snapshot = await getChannelLiveStudioSnapshotAction();

  return (
    <ChannelDonationSettingsPage initialSnapshot={snapshot.success ? snapshot.data : undefined} />
  );
}
