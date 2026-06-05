// 채널 후원 설정 페이지를 렌더링합니다.
import { ChannelDonationPageContent } from "@/components/channel/donation/channel-donation-page-content";

import { getChannelDonationSnapshot } from "./_data/channel-donation-data";

export default async function ChannelDonationPage() {
  const result = await getChannelDonationSnapshot();

  return (
    <ChannelDonationPageContent initialSnapshot={result.success ? (result.data ?? null) : null} />
  );
}
