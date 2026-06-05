// 방송 운영 UI 페이지를 렌더링합니다.
import { getChannelLiveStudioSnapshotAction } from "@/actions/channel/live";
import ChannelLiveOperationPage from "@/components/channel/live/channel-live-operation-page";

export default async function ChannelLivePage() {
  const snapshot = await getChannelLiveStudioSnapshotAction();

  return (
    <ChannelLiveOperationPage initialSnapshot={snapshot.success ? snapshot.data : undefined} />
  );
}
