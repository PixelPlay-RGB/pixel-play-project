// 채팅 설정 페이지를 렌더링합니다.
import { getChannelLiveStudioSnapshotAction } from "@/actions/channel/live";
import ChannelChatSettingsPage from "@/components/channel/chat/channel-chat-settings-page";

export default async function ChannelChatPage() {
  const snapshot = await getChannelLiveStudioSnapshotAction();

  return <ChannelChatSettingsPage initialSnapshot={snapshot.success ? snapshot.data : undefined} />;
}
