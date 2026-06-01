// 채널 채팅 설정 페이지를 렌더링합니다.
import { ChannelChatPageContent } from "@/components/channel/chat/channel-chat-page-content";

import { getChannelChatSnapshot } from "./_data/channel-chat-data";

export default async function ChannelChatPage() {
  const result = await getChannelChatSnapshot();

  return <ChannelChatPageContent initialSnapshot={result.success ? (result.data ?? null) : null} />;
}
