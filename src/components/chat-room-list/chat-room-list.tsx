"use client";

import ChatRoomCard from "@/components/chat-room-list/chat-room-card";
import ChatRoomEmptyState from "@/components/chat-room-list/chat-room-empty-state";
import ChatRoomListHeader from "@/components/chat-room-list/chat-room-list-header";
import ChatRoomListSkeleton from "@/components/chat-room-list/chat-room-list-skeleton";
import ChatRoomPagination from "@/components/chat-room-list/chat-room-pagination";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import {
  CHAT_ROOM_SORT_OPTIONS_BY_TAB,
  DEFAULT_CHAT_ROOM_SORT_OPTION,
} from "@/constants/chat-room";
import { useChatRoomList } from "@/hooks/use-chat-room-list";
import { useUser } from "@/hooks/use-profile";
import { useChatRoomStore } from "@/stores/chat-room";
import { getAppMessage } from "@/utils/app-message";
import { EMPTY_CHAT_ROOM_LIST } from "@/utils/chat-room-list";

export default function ChatRoomList() {
  const tabType = useChatRoomStore((state) => state.tabType);
  const sortOption = useChatRoomStore((state) => state.sortOption);
  const currentPage = useChatRoomStore((state) => state.currentPage);
  const searchQuery = useChatRoomStore((state) => state.searchQuery);
  const setCurrentPage = useChatRoomStore((state) => state.setCurrentPage);
  const { isFetched: isUserFetched } = useUser();

  const selectedSortOption = CHAT_ROOM_SORT_OPTIONS_BY_TAB[tabType].includes(sortOption)
    ? sortOption
    : DEFAULT_CHAT_ROOM_SORT_OPTION;
  const query = useChatRoomList(tabType, selectedSortOption, currentPage, searchQuery);

  const chatRoomList = query.data ?? EMPTY_CHAT_ROOM_LIST;
  const chatRooms = chatRoomList.rooms;

  const isInitialLoading = !isUserFetched || query.isLoading;
  const isEmpty = isUserFetched && !query.isLoading && chatRooms.length === 0;
  const isPageFetching = query.isFetching && query.isPlaceholderData;

  if (query.isError) {
    const message = getAppMessage(APP_MESSAGE_CODE.error.chatRoomList.loadFailed);
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center">
        {message.title}
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-5">
      <ChatRoomListHeader counts={chatRoomList.counts} isFetching={isPageFetching} />

      <div className="flex flex-1 flex-col">
        {isInitialLoading ? (
          <ChatRoomListSkeleton />
        ) : isEmpty ? (
          <ChatRoomEmptyState tabType={tabType} searchQuery={searchQuery} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {chatRooms.map((chatRoom) => (
              <ChatRoomCard
                key={chatRoom.id}
                chatRoom={chatRoom}
                unreadMessageCount={chatRoom.unread_count}
              />
            ))}
          </div>
        )}
      </div>

      <ChatRoomPagination
        currentPage={currentPage}
        totalPages={chatRoomList.totalPages}
        isFetching={isPageFetching}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
