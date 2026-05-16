// 채팅방 목록 빈 상태를 렌더링합니다.
import { CHAT_ROOM_EMPTY_MESSAGES } from "@/constants/chat-room";
import { cn } from "@/lib/utils";
import type { ChatRoomTab } from "@/types/chat-room";
import { MessageSquare, Search } from "lucide-react";

interface Props {
  tabType: ChatRoomTab;
  searchQuery?: string;
}

export default function ChatRoomListEmptyState({ tabType, searchQuery }: Props) {
  const isSearching = !!searchQuery && searchQuery.trim().length > 0;

  return (
    <div className={cn("flex flex-col items-center justify-center text-center", "py-24")}>
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl",
          "bg-brand/10 ring-brand/20 dark:bg-brand/15 ring-1",
          "mb-4",
        )}
      >
        {isSearching ? (
          <Search className="text-brand h-7 w-7" />
        ) : (
          <MessageSquare className="text-brand h-7 w-7" />
        )}
      </div>
      <h3 className="text-foreground text-base font-bold">
        {isSearching ? "검색 결과가 없습니다" : "채팅방이 없습니다"}
      </h3>
      <p className="text-muted-foreground mt-1.5 text-sm">
        {isSearching
          ? `"${searchQuery.trim()}"에 해당하는 채팅방을 찾지 못했습니다.`
          : CHAT_ROOM_EMPTY_MESSAGES[tabType]}
      </p>
    </div>
  );
}
