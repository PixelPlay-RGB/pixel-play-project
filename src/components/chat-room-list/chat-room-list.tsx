"use client";
// chat-room-list 컴포넌트를 제공합니다.

import ChatRoomListEmptyState from "@/components/chat-room-list/chat-room-list-empty-state";
import ChatRoomListHeader from "@/components/chat-room-list/chat-room-list-header";
import ChatRoomListPagination from "@/components/chat-room-list/chat-room-list-pagination";
import ChatRoomListUnreadRealtimeListener from "@/components/chat-room-list/chat-room-list-unread-realtime-listener";
import ChatRoomCard from "@/components/chat-room/shared/chat-room-card";
import ChatRoomCardGridSkeleton from "@/components/chat-room/shared/chat-room-card-grid-skeleton";
import { APP_MESSAGE_CODE } from "@/constants/common/app-message-code";
import { useChatRoomList } from "@/hooks/chat-room/use-chat-room-list";
import { useChatRoomPageSize } from "@/hooks/chat-room/use-chat-room-page-size";
import { resolveProfileQueryErrorCode, useUser } from "@/hooks/profile/use-profile";
import { useChatRoomStore } from "@/stores/chat-room";
import { EMPTY_CHAT_ROOM_LIST, getValidChatRoomSortOption } from "@/utils/chat-room/chat-room-list";
import { getAppMessage } from "@/utils/common/app-message";
import { useCallback } from "react";

export default function ChatRoomList() {
  const tabType = useChatRoomStore((state) => state.tabType);
  const sortOption = useChatRoomStore((state) => state.sortOption);
  const currentPage = useChatRoomStore((state) => state.currentPage);
  const searchQuery = useChatRoomStore((state) => state.searchQuery);
  const setCurrentPage = useChatRoomStore((state) => state.setCurrentPage);
  const { error: userError, isError: isUserError, isFetched: isUserFetched } = useUser();
  const handlePageSizeChange = useCallback(() => {
    setCurrentPage(1);
  }, [setCurrentPage]);
  const pageSize = useChatRoomPageSize({ onPageSizeChange: handlePageSizeChange });

  const selectedSortOption = getValidChatRoomSortOption(tabType, sortOption);
  const query = useChatRoomList(tabType, selectedSortOption, currentPage, searchQuery, pageSize);

  const chatRoomList = query.data ?? EMPTY_CHAT_ROOM_LIST;
  const chatRooms = chatRoomList.rooms;

  const isInitialLoading = !isUserFetched || query.isLoading;
  const isEmpty = isUserFetched && !query.isLoading && chatRooms.length === 0;
  const isPageFetching = query.isFetching && query.isPlaceholderData;

  if (isUserError || query.isError) {
    const message = getAppMessage(
      isUserError
        ? resolveProfileQueryErrorCode(userError)
        : APP_MESSAGE_CODE.error.chatRoomList.loadFailed,
    );
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center">
        {message.title}
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-5">
      <ChatRoomListUnreadRealtimeListener />
      <ChatRoomListHeader counts={chatRoomList.counts} isFetching={isPageFetching} />

      <div className="flex flex-1 flex-col">
        {isInitialLoading ? (
          <ChatRoomCardGridSkeleton count={pageSize ?? undefined} />
        ) : isEmpty ? (
          <ChatRoomListEmptyState tabType={tabType} searchQuery={searchQuery} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

      <ChatRoomListPagination
        currentPage={currentPage}
        totalPages={chatRoomList.totalPages}
        isFetching={isPageFetching}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
