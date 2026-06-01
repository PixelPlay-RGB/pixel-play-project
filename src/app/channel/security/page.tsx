// 채널 보안과 OBS 송출 설정 페이지를 렌더링합니다.
import { getChannelLiveStudioSnapshotAction } from "@/actions/channel/live";
import ChannelSecuritySettingsPage from "@/components/channel/security/channel-security-settings-page";

export default async function ChannelSecurityPage() {
  const snapshot = await getChannelLiveStudioSnapshotAction();

  return (
    <ChannelSecuritySettingsPage initialSnapshot={snapshot.success ? snapshot.data : undefined} />
  );
}
