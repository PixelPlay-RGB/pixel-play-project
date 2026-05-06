"use client";

import ChatRoomListSkeleton from "@/components/chat/chat-room-list-skeleton";
import ChatRoomCard from "@/components/chat/chat-room-card";
import ChatRoomTabs from "@/components/chat/chat-room-tabs";
import CreateChatRoomDialog from "@/components/chat/create-chat-room-dialog";
import { useChatRooms } from "@/hooks/use-chat-rooms";
import { cn } from "@/lib/utils";
import { useChatRoomStore } from "@/stores/chat-room";

const MOCK_UNREAD_MESSAGE_COUNTS = [8, 0, 23, 3, 105, 0, 12, 1];

export default function ChatRoomList() {
  const tabType = useChatRoomStore((state) => state.tabType);
  const { data: rooms = [], isError, isLoading } = useChatRooms(tabType);

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center text-zinc-500">
        채팅방 목록을 불러오지 못했습니다.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "mb-6 flex flex-col gap-4 border-b border-zinc-200 pb-5",
          "sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:pb-6",
          "dark:border-zinc-800/50",
        )}
      >
        <ChatRoomTabs />
        <CreateChatRoomDialog />
      </div>

      {isLoading ? (
        <ChatRoomListSkeleton />
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
