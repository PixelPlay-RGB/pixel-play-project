import { CHAT_ROOM_EMPTY_MESSAGES } from "@/constants/chat-room";
import type { ChatRoomTab } from "@/types/chat-room";
import { MessageSquare } from "lucide-react";

interface Props {
  tabType: ChatRoomTab;
}

export default function ChatRoomEmptyState({ tabType }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 ring-1 ring-brand/20 dark:bg-brand/15">
        <MessageSquare className="h-7 w-7 text-brand" />
      </div>
      <h3 className="text-base font-bold text-foreground">채팅방이 없습니다</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{CHAT_ROOM_EMPTY_MESSAGES[tabType]}</p>
    </div>
  );
}
