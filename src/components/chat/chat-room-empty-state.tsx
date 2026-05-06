import { CHAT_ROOM_EMPTY_MESSAGES } from "@/constants/chat-room";
import { cn } from "@/lib/utils";
import type { ChatRoomTab } from "@/types/chat-room";
import { MessageSquare } from "lucide-react";

interface Props {
  tabType: ChatRoomTab;
}

export default function ChatRoomEmptyState({ tabType }: Props) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", "py-24")}>
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl",
          "bg-brand/10 ring-brand/20 dark:bg-brand/15 ring-1",
          "mb-4",
        )}
      >
        <MessageSquare className="text-brand h-7 w-7" />
      </div>
      <h3 className="text-foreground text-base font-bold">채팅방이 없습니다</h3>
      <p className="text-muted-foreground mt-1.5 text-sm">{CHAT_ROOM_EMPTY_MESSAGES[tabType]}</p>
    </div>
  );
}
