import ChatRoomTabs from "@/components/chat/chat-room-tabs";
import CreateChatRoomDialog from "@/components/chat/create-chat-room-dialog";
import type { ChatRoomTab } from "@/types/chat-room";
import { cn } from "@/lib/utils";

interface Props {
  roomCount: number;
  tabType: ChatRoomTab;
}

export default function ChatRoomListHeader({ roomCount, tabType }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border/50 pb-5 lg:flex-row lg:items-center lg:justify-between",
      )}
    >
      <ChatRoomTabs counts={{ [tabType]: roomCount }} />
      <div className={cn("flex w-full items-center justify-between gap-3 lg:w-auto lg:justify-end")}>
        <p className={cn("shrink-0 pl-1 text-xs text-muted-foreground lg:pl-0")}>
          채팅방 <span className={cn("font-bold text-brand")}>{roomCount}</span>개
        </p>
        <CreateChatRoomDialog />
      </div>
    </div>
  );
}
