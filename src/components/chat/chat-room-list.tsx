"use client";

import ChatRoomCard from "@/components/chat/chat-room-card";
import ChatRoomEmptyState from "@/components/chat/chat-room-empty-state";
import ChatRoomListHeader from "@/components/chat/chat-room-list-header";
import ChatRoomListSkeleton from "@/components/chat/chat-room-list-skeleton";
import { useChatRoomInfiniteScroll } from "@/hooks/use-chat-room-infinite-scroll";
import { CHAT_ROOM_PAGE_SIZE, useChatRooms } from "@/hooks/use-chat-rooms";
import { useUser } from "@/hooks/use-profile";
import { useChatRoomCounts } from "@/hooks/use-chat-room-counts";
import { MOCK_UNREAD_MESSAGE_COUNTS } from "@/mock/chat-room";
import { useChatRoomStore } from "@/stores/chat-room";

export default function ChatRoomList() {
  const tabType = useChatRoomStore((state) => state.tabType);
  const { isFetched: isUserFetched } = useUser();
  const { data, isError, isFetching, isLoading } = useChatRooms(tabType);
  const { visibleChatrooms, hasMore, totalCount, sentinelRef } = useChatRoomInfiniteScroll(
    data ?? [],
    tabType,
  );
  const { data: counts } = useChatRoomCounts();

  const isInitialLoading = !isUserFetched || (isLoading && totalCount === 0);
  const isEmpty = isUserFetched && !isFetching && totalCount === 0;

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center text-zinc-500">
        채팅방 목록을 불러오지 못했습니다.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <ChatRoomListHeader roomCount={totalCount} counts={counts} />

      {isInitialLoading ? (
        <ChatRoomListSkeleton />
      ) : isEmpty ? (
        <ChatRoomEmptyState tabType={tabType} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {visibleChatrooms.map((chatroom, index) => (
              <ChatRoomCard
                key={chatroom.id}
                chatRoom={chatroom}
                unreadMessageCount={
                  MOCK_UNREAD_MESSAGE_COUNTS[index % MOCK_UNREAD_MESSAGE_COUNTS.length]
                }
              />
            ))}
          </div>
          <div ref={sentinelRef} aria-hidden="true" />
          {!hasMore && totalCount > CHAT_ROOM_PAGE_SIZE && (
            <p className="text-muted-foreground text-center text-sm">
              모든 채팅방을 불러왔습니다.
            </p>
          )}
        </>
      )}
    </div>
  );
}
