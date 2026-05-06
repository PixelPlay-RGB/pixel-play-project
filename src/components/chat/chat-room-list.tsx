"use client";

import ChatRoomEmptyState from "@/components/chat/chat-room-empty-state";
import ChatRoomListHeader from "@/components/chat/chat-room-list-header";
import ChatRoomListSkeleton from "@/components/chat/chat-room-list-skeleton";
import ChatRoomCard from "@/components/chat/chat-room-card";
import { useChatRooms } from "@/hooks/use-chat-rooms";
import { MOCK_UNREAD_MESSAGE_COUNTS } from "@/mock/chat-room";
import { useChatRoomStore } from "@/stores/chat-room";

export default function ChatRoomList() {
  const tabType = useChatRoomStore((state) => state.tabType);
  const {
    data: rooms = [],
    isError,
    isFetching,
    isLoading,
    isPlaceholderData,
  } = useChatRooms(tabType);
  const isInitialLoading = isLoading && rooms.length === 0;
  const isEmpty = !isFetching && !isPlaceholderData && rooms.length === 0;

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center text-zinc-500">
        채팅방 목록을 불러오지 못했습니다.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <ChatRoomListHeader roomCount={rooms.length} tabType={tabType} />

      {isInitialLoading ? (
        <ChatRoomListSkeleton />
      ) : isEmpty ? (
        <ChatRoomEmptyState tabType={tabType} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {rooms.map((room, index) => (
            <ChatRoomCard
              key={room.id}
              chatRoom={room}
              unreadMessageCount={MOCK_UNREAD_MESSAGE_COUNTS[index % MOCK_UNREAD_MESSAGE_COUNTS.length]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
