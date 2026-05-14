"use client";

import ChatRoomCard from "@/components/chat/chat-room-card";
import ChatRoomEmptyState from "@/components/chat/chat-room-empty-state";
import ChatRoomListHeader from "@/components/chat/chat-room-list-header";
import ChatRoomListSkeleton from "@/components/chat/chat-room-list-skeleton";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { Spinner } from "@/components/ui/spinner";
import { useChatRoomCounts } from "@/hooks/use-chat-room-counts";
import {
  CHAT_ROOM_SORT_OPTIONS_BY_TAB,
  DEFAULT_CHAT_ROOM_SORT_OPTION,
} from "@/constants/chat-room";
import { useChatRooms } from "@/hooks/use-chat-rooms";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useUser } from "@/hooks/use-profile";
import { useChatRoomStore } from "@/stores/chat-room";
import { getAppMessage } from "@/utils/app-message";

export default function ChatRoomList() {
  const tabType = useChatRoomStore((state) => state.tabType);
  const sortOption = useChatRoomStore((state) => state.sortOption);
  const { isFetched: isUserFetched } = useUser();

  const selectedSortOption = CHAT_ROOM_SORT_OPTIONS_BY_TAB[tabType].includes(sortOption)
    ? sortOption
    : DEFAULT_CHAT_ROOM_SORT_OPTION;
  const query = useChatRooms(tabType, selectedSortOption);
  const { data: counts } = useChatRoomCounts();

  const chatRooms = query.data?.pages.flatMap((page) => page) ?? [];

  const sentinelRef = useIntersectionObserver(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  });

  const isInitialLoading = !isUserFetched || query.isLoading;
  const isEmpty = isUserFetched && !query.isLoading && chatRooms.length === 0;

  if (query.isError) {
    const message = getAppMessage(APP_MESSAGE_CODE.error.chatRoomList.loadFailed);
    return (
      <div className="flex flex-1 items-center justify-center text-zinc-500">{message.title}</div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <ChatRoomListHeader counts={counts} />

      {isInitialLoading ? (
        <ChatRoomListSkeleton />
      ) : isEmpty ? (
        <ChatRoomEmptyState tabType={tabType} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {chatRooms.map((chatRoom) => (
              <ChatRoomCard
                key={chatRoom.id}
                chatRoom={chatRoom}
                unreadMessageCount={chatRoom.unread_count}
              />
            ))}
          </div>
          {query.isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Spinner className="text-muted-foreground size-5" />
            </div>
          )}
          <div ref={sentinelRef} aria-hidden="true" />
          {!query.hasNextPage && !query.isLoading && chatRooms.length > 0 && (
            <p className="text-muted-foreground text-center text-sm">모든 채팅방을 불러왔습니다.</p>
          )}
        </>
      )}
    </div>
  );
}
