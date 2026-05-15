import CreateChatRoomDialog from "@/components/chat/create-chat-room-dialog";
import ChatRoomSortMenu from "@/components/chat/chat-room-sort-menu";
import ChatRoomTabs from "@/components/chat/chat-room-tabs";
import { cn } from "@/lib/utils";
import type { ChatRoomCounts } from "@/types/chat-room";

interface Props {
  counts?: ChatRoomCounts;
  isFetching?: boolean;
}

export default function ChatRoomListHeader({ counts, isFetching = false }: Props) {
  return (
    <div
      className={cn(
        "border-border/50 flex flex-col gap-3 border-b pb-5",
        "lg:flex-row lg:items-center lg:justify-between",
      )}
    >
      <ChatRoomTabs counts={counts} isFetching={isFetching} />
      <div
        className={cn("flex w-full items-center justify-between gap-3", "lg:w-auto lg:justify-end")}
      >
        <ChatRoomSortMenu />
        <CreateChatRoomDialog />
      </div>
    </div>
  );
}
