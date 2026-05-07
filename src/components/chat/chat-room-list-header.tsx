import CreateChatRoomDialog from "@/components/chat/create-chat-room-dialog";
import ChatRoomTabs from "@/components/chat/chat-room-tabs";
import type { ChatRoomTab } from "@/types/chat-room";
import { cn } from "@/lib/utils";

interface Props {
  totalCount: number;
  tabType: ChatRoomTab;
}

export default function ChatRoomListHeader({ totalCount, tabType }: Props) {
  return (
    <div
      className={cn(
        "border-border/50 flex flex-col gap-3 border-b pb-5",
        "lg:flex-row lg:items-center lg:justify-between",
      )}
    >
      <ChatRoomTabs counts={{ [tabType]: totalCount }} />
      <div
        className={cn("flex w-full items-center justify-between gap-3", "lg:w-auto lg:justify-end")}
      >
        <p className={cn("text-muted-foreground shrink-0 pl-1 text-xs", "lg:pl-0")}>
          채팅방 <span className="text-brand font-bold">{totalCount}</span>개
        </p>
        <CreateChatRoomDialog />
      </div>
    </div>
  );
}
