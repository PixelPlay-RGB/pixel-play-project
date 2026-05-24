// chat-room-list-header 컴포넌트를 제공합니다.
import ChatRoomListCreateDialog from "@/components/chat-room-list/chat-room-list-create-dialog";
import ChatRoomListSearchInput from "@/components/chat-room-list/chat-room-list-search-input";
import ChatRoomListSortMenu from "@/components/chat-room-list/chat-room-list-sort-menu";
import ChatRoomListTabs from "@/components/chat-room-list/chat-room-list-tabs";
import { cn } from "@/lib/utils";
import type { ChatRoomCounts } from "@/types/chat-room/chat-room";

interface Props {
  counts?: ChatRoomCounts;
  isFetching?: boolean;
}

export default function ChatRoomListHeader({ counts, isFetching = false }: Props) {
  return (
    <div className={cn("border-border/50 flex flex-col gap-4 border-b pb-5")}>
      <div className="flex flex-col gap-1.5">
        <p className="text-brand text-sm font-black tracking-wide">채팅방</p>
        <h1 className="text-foreground text-2xl leading-tight font-black tracking-tight sm:text-3xl">
          지금 떠있는 방들 둘러보기
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-6">
          관심 가는 방에 들어가서 바로 대화를 시작하세요.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div
          className={cn("flex flex-col gap-3", "lg:flex-row lg:items-center lg:justify-between")}
        >
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
    </div>
  );
}
