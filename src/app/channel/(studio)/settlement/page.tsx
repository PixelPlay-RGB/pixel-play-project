// 채널 정산 내역 페이지를 렌더링합니다.
import { ChannelSettlementPageContent } from "@/components/channel/settlement/channel-settlement-page-content";

import { getSettlementYearlySummaryAction } from "@/actions/channel/settlement";

import { getChannelDonationSnapshot } from "../donation/_data/channel-donation-data";

export default async function ChannelSettlementPage() {
  const [snapshotResult, yearlyResult] = await Promise.all([
    getChannelDonationSnapshot(),
    getSettlementYearlySummaryAction(),
  ]);

  return (
    <ChannelSettlementPageContent
      initialSnapshot={snapshotResult.success ? (snapshotResult.data ?? null) : null}
      yearlySummary={yearlyResult.success ? (yearlyResult.data ?? []) : []}
    />
  );
}
