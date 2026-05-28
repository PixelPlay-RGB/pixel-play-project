// 라이브 시청 화면 우측 채팅 패널 — 후원 배너, 메시지 목록, 입력 바, CTA를 조합합니다.

import { ScrollArea } from "@/components/ui/scroll-area";
import { LiveChatParticipationNotice } from "@/components/live/view/live-chat-participation-notice";
import { LiveChatInputBar } from "@/components/live/view/live-chat-input-bar";
import { LiveChatMessageList } from "@/components/live/chat/live-chat-message-list";
import { LiveDonationBanner } from "@/components/live/view/live-donation-banner";
import { LiveChatMenu } from "@/components/live/view/live-chat-menu";
import { LIVE_LABEL } from "@/constants/live/live";
import type { LiveChatMessage, LiveDonation, LivePoll, LiveViewerChatState } from "@/types/live/live";

interface Props {
  messages: LiveChatMessage[];
  donations: LiveDonation[];
  polls: LivePoll[];
  chatState: LiveViewerChatState;
  isLoggedIn: boolean;
  onLoginPrompt: () => void;
  onSendMessage: (content: string) => Promise<void>;
}

export function LiveChatPanel({
  messages,
  donations,
  polls,
  chatState,
  isLoggedIn,
  onLoginPrompt,
  onSendMessage,
}: Props) {
  return (
    <div className="border-border bg-card flex h-full min-h-96 flex-col overflow-hidden rounded-xl border md:min-h-0">
      {/* 헤더 */}
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <span className="text-foreground text-sm font-semibold">{LIVE_LABEL.chat}</span>
        <LiveChatMenu />
      </div>

      {/* 메시지 영역 — 배너를 absolute로 위에 띄움 */}
      <div className="relative min-h-0 flex-1">
        <ScrollArea className="h-full">
          {/* 배너 높이만큼 상단 여백 확보 */}
          <div className="h-21" />
          <LiveChatMessageList messages={messages} />
        </ScrollArea>
        <div className="absolute inset-x-0 top-0 z-10 px-2 pt-2">
          <LiveDonationBanner donations={donations} />
        </div>
      </div>

      {/* 하단 고정 영역 */}
      <LiveChatParticipationNotice chatUnavailableReason={chatState.chatUnavailableReason} />
      <LiveChatInputBar
        polls={polls}
        chatState={chatState}
        isLoggedIn={isLoggedIn}
        onLoginPrompt={onLoginPrompt}
        onSendMessage={onSendMessage}
      />
    </div>
  );
}
