import ChatRoomListCreateDialog from "@/components/chat-room-list/chat-room-list-create-dialog";
import ChatRoomListSearchInput from "@/components/chat-room-list/chat-room-list-search-input";
import ChatRoomListSortMenu from "@/components/chat-room-list/chat-room-list-sort-menu";
import ChatRoomListTabs from "@/components/chat-room-list/chat-room-list-tabs";
import { cn } from "@/lib/utils";
import type { ChatRoomCounts } from "@/types/chat-room";

interface Props {
  counts?: ChatRoomCounts;
  isFetching?: boolean;
}

export default function ChatRoomListHeader({ counts, isFetching = false }: Props) {
  return (
    <div className={cn("border-border/50 flex flex-col gap-3 border-b pb-5")}>
      <div className={cn("flex flex-col gap-3", "lg:flex-row lg:items-center lg:justify-between")}>
        <ChatRoomListTabs counts={counts} isFetching={isFetching} />
        <div
          className={cn(
            "flex w-full items-center justify-between gap-3",
            "lg:w-auto lg:justify-end",
          )}
        >
          <ChatRoomListSortMenu />
          <ChatRoomListCreateDialog />
        </div>
      </div>
      <ChatRoomListSearchInput />
    </div>
  );
}
