"use client";

import { useUser } from "@/hooks/use-profile";
import ChatRoomEmptyState from "@/components/chat/chat-room-empty-state";
import ChatRoomListHeader from "@/components/chat/chat-room-list-header";
import ChatRoomListSkeleton from "@/components/chat/chat-room-list-skeleton";
import ChatRoomCard from "@/components/chat/chat-room-card";
import { useChatRooms } from "@/hooks/use-chat-rooms";
import { MOCK_UNREAD_MESSAGE_COUNTS } from "@/mock/chat-room";
import { useChatRoomStore } from "@/stores/chat-room";
import { useUserStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

export default function ChatRoomList() {
  const tabType = useChatRoomStore((state) => state.tabType);
  const authLoading = useUserStore((state) => state.loading);
  const { isFetched: isUserFetched } = useUser();
  const {
    data: rooms = [],
    isError,
    isFetching,
    isLoading,
    isPlaceholderData,
  } = useChatRooms(tabType);

  // 유저 정보 로딩 중이거나 채팅방 데이터 초기 로딩 중일 때 스켈레톤 표시
  const isInitialLoading = authLoading || !isUserFetched || (isLoading && rooms.length === 0);
  const isEmpty =
    !authLoading && isUserFetched && !isFetching && !isPlaceholderData && rooms.length === 0;

  if (isError) {
    return (
      <div className={cn("flex flex-1 items-center justify-center text-zinc-500")}>
        채팅방 목록을 불러오지 못했습니다.
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-5")}>
      <ChatRoomListHeader roomCount={rooms.length} tabType={tabType} />

      {isInitialLoading ? (
        <ChatRoomListSkeleton />
      ) : isEmpty ? (
        <ChatRoomEmptyState tabType={tabType} />
      ) : (
        <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4")}>
          {rooms.map((room, index) => (
            <ChatRoomCard
              key={room.id}
              chatRoom={room}
              unreadMessageCount={
                MOCK_UNREAD_MESSAGE_COUNTS[index % MOCK_UNREAD_MESSAGE_COUNTS.length]
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
