"use client";

import ChatRoomCard from "@/components/chat/chat-room-card";
import ChatRoomEmptyState from "@/components/chat/chat-room-empty-state";
import ChatRoomListHeader from "@/components/chat/chat-room-list-header";
import ChatRoomListSkeleton from "@/components/chat/chat-room-list-skeleton";
import ChatRoomPagination from "@/components/chat/chat-room-pagination";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { useChatRoomCounts } from "@/hooks/use-chat-room-counts";
import {
  CHAT_ROOM_PAGE_SIZE,
  CHAT_ROOM_SORT_OPTIONS_BY_TAB,
  DEFAULT_CHAT_ROOM_SORT_OPTION,
} from "@/constants/chat-room";
import { useChatRooms } from "@/hooks/use-chat-rooms";
import { useUser } from "@/hooks/use-profile";
import { useChatRoomStore } from "@/stores/chat-room";
import { getAppMessage } from "@/utils/app-message";

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
  const query = useChatRooms(tabType, selectedSortOption, currentPage, searchQuery);
  const { data: counts } = useChatRoomCounts();

  const chatRooms = query.data ?? [];

  // 검색 중이면 RPC 응답의 total_count 기반, 아니면 캐시된 counts[tabType] 사용
  const isSearching = searchQuery.trim().length > 0;
  const totalItems = isSearching ? (chatRooms[0]?.total_count ?? 0) : (counts?.[tabType] ?? 0);
  const totalPages = Math.ceil(totalItems / CHAT_ROOM_PAGE_SIZE);

  // 검색 중일 때 현재 탭의 카운트를 total_count로 교체 → ChatRoomTabs에 반영
  const effectiveCounts = isSearching && counts
    ? { ...counts, [tabType]: chatRooms[0]?.total_count ?? 0 }
    : counts;

  const isInitialLoading = !isUserFetched || query.isLoading;
  const isEmpty = isUserFetched && !query.isLoading && chatRooms.length === 0;
  const isPageFetching = query.isFetching && query.isPlaceholderData;

  if (query.isError) {
    const message = getAppMessage(APP_MESSAGE_CODE.error.chatRoomList.loadFailed);
    return (
      <div className="flex flex-1 items-center justify-center text-zinc-500">{message.title}</div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-5">
      <ChatRoomListHeader counts={effectiveCounts} isFetching={isPageFetching} />

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
        totalPages={totalPages}
        isFetching={isPageFetching}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
