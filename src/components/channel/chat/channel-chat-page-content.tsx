// 채널 채팅 설정 화면의 서버 렌더링 영역을 구성합니다.

import { ChannelChatControls } from "@/components/channel/chat/channel-chat-controls";
import { LoadFailedState } from "@/components/common/load-failed-state";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import type { ChannelChatSnapshot } from "@/types/channel/chat";

interface Props {
  initialSnapshot: ChannelChatSnapshot | null;
}

export function ChannelChatPageContent({ initialSnapshot }: Props) {
  if (!initialSnapshot) {
    return <LoadFailedState code={APP_MESSAGE_CODE.error.channel.chatSettingsLoadFailed} />;
  }

  return <ChannelChatControls initialSnapshot={initialSnapshot} />;
}
