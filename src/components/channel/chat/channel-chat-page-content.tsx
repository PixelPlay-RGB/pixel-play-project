// 채널 채팅 설정 화면의 서버 렌더링 영역을 구성합니다.

import { ChannelChatControls } from "@/components/channel/chat/channel-chat-controls";
import { ChatSettingsLoadFailedState } from "@/components/channel/chat/chat-settings-load-failed-state";
import type { ChannelChatSnapshot } from "@/types/channel/chat";

interface Props {
  initialSnapshot: ChannelChatSnapshot | null;
}

export function ChannelChatPageContent({ initialSnapshot }: Props) {
  if (!initialSnapshot) {
    return <ChatSettingsLoadFailedState />;
  }

  return (
    <main className="flex w-full flex-col gap-5">
      <ChannelChatControls initialSnapshot={initialSnapshot} />
    </main>
  );
}
