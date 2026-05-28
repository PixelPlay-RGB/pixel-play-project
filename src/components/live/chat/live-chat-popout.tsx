"use client";
// 라이브 채팅 전용 팝아웃 화면입니다. /live/[creatorId]/chat에서 사용합니다.

import { Radio } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";
import { LiveChatMessageList } from "@/components/live/chat/live-chat-message-list";
import { LIVE_LABEL } from "@/constants/live/live";
import {
  MOCK_DEFAULT_BROADCAST,
  MOCK_LIVE_BROADCASTS,
  MOCK_LIVE_CHAT_MESSAGES,
} from "@/mock/live-room";

interface Props {
  creatorId: string;
}

export function LiveChatPopout({ creatorId }: Props) {
  const broadcast = MOCK_LIVE_BROADCASTS[creatorId] ?? MOCK_DEFAULT_BROADCAST;

  return (
    <div className="bg-card flex h-screen flex-col">
      {/* 팝아웃 헤더 */}
      <div className="border-border flex items-center gap-2 border-b px-4 py-3">
        <span className="bg-live flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-bold text-white">
          <Radio className="size-3" />
          {LIVE_LABEL.live}
        </span>
        <span className="text-foreground text-sm font-semibold">{broadcast.creator.name}</span>
        <span className="text-muted-foreground ml-auto text-xs">{LIVE_LABEL.chat}</span>
      </div>

      {/* 메시지 영역 */}
      <ScrollArea className="min-h-0 flex-1">
        <LiveChatMessageList messages={MOCK_LIVE_CHAT_MESSAGES} />
      </ScrollArea>

      {/* 입력 행 */}
      <div className="border-border flex items-center gap-2 border-t px-3 py-3">
        <Button size="sm" variant="ghost" aria-label="이모티콘" className="size-8 shrink-0 p-0">
          <Smile className="text-muted-foreground size-5" />
        </Button>
        <Input
          placeholder={LIVE_LABEL.chatLoginPlaceholder}
          aria-label={LIVE_LABEL.chatLoginPlaceholder}
          className="bg-muted/70 h-8 flex-1 text-sm"
          readOnly
        />
      </div>
    </div>
  );
}
