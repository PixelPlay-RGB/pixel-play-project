// 채널 채팅 설정 화면의 서버 렌더링 영역을 구성합니다.

import { ChannelSideTipCard } from "@/components/channel/channel-side-tip-card";
import { ChannelChatControls } from "@/components/channel/chat/channel-chat-controls";
import { ChatSettingsLoadFailedState } from "@/components/channel/chat/chat-settings-load-failed-state";
import type { ChannelChatSnapshot } from "@/types/channel/chat";
import { MessageSquareText } from "lucide-react";

interface Props {
  initialSnapshot: ChannelChatSnapshot | null;
}

export function ChannelChatPageContent({ initialSnapshot }: Props) {
  if (!initialSnapshot) {
    return <ChatSettingsLoadFailedState />;
  }

  return (
    <main className="grid w-full gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_24rem]">
      <ChannelChatControls initialSnapshot={initialSnapshot} />

      <ChannelSideTipCard
        className="xl:sticky xl:top-6 xl:w-full"
        icon={<MessageSquareText className="size-5" />}
        title="메시지와 안내 UI를 분리해요"
        description={`가려진 채팅은 메시지 기록으로 남기고, 로그인 안내와 규칙 확인은 시청자 상태에 맞춰 화면에만 보여줘요.\n채팅 설정은 시청자가 입력창에서 바로 체감하는 규칙이라 짧고 분명할수록 좋아요.`}
      />
    </main>
  );
}
