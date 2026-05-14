"use client";

import ChatRoomCard from "@/components/chat/chat-room-card";
import ChatRoomEmptyState from "@/components/chat/chat-room-empty-state";
import ChatRoomListHeader from "@/components/chat/chat-room-list-header";
import ChatRoomListSkeleton from "@/components/chat/chat-room-list-skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useChatRooms } from "@/hooks/use-chat-rooms";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useUser } from "@/hooks/use-profile";
import { useChatRoomCounts } from "@/hooks/use-chat-room-counts";
import { MOCK_UNREAD_MESSAGE_COUNTS } from "@/mock/chat-room";
import { useChatRoomStore } from "@/stores/chat-room";

export default function ChatRoomList() {
  const tabType = useChatRoomStore((state) => state.tabType);
  const { isFetched: isUserFetched } = useUser();
  const query = useChatRooms(tabType);
  const { data: counts } = useChatRoomCounts();

  const chatrooms = query.data?.pages.flatMap((page) => page) ?? [];
  const totalCount = counts?.[tabType] ?? chatrooms.length;

  const sentinelRef = useIntersectionObserver(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  });

  const isInitialLoading = !isUserFetched || query.isLoading;
  const isEmpty = isUserFetched && !query.isLoading && chatrooms.length === 0;

  if (query.isError) {
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
            {chatrooms.map((chatroom, index) => (
              <ChatRoomCard
                key={chatroom.id}
                chatRoom={chatroom}
                unreadMessageCount={
                  MOCK_UNREAD_MESSAGE_COUNTS[index % MOCK_UNREAD_MESSAGE_COUNTS.length]
                }
              />
            ))}
          </div>
          {query.isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Spinner className="text-muted-foreground size-5" />
            </div>
          )}
          <div ref={sentinelRef} aria-hidden="true" />
          {!query.hasNextPage && !query.isLoading && chatrooms.length > 0 && (
            <p className="text-muted-foreground text-center text-sm">
              모든 채팅방을 불러왔습니다.
            </p>
          )}
        </>
      )}
    </div>
  );
}
