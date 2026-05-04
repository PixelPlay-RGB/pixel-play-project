"use client";

import ChatRoomListSkeleton from "@/components/chat/chat-room-list-skeleton";
import ChatRoomCard from "@/components/chat/chat-room-card";
import ChatRoomFeedback from "@/components/chat/chat-room-feedback";
import ChatRoomTabs from "@/components/chat/chat-room-tabs";
import CreateChatRoomDialog from "@/components/chat/create-chat-room-dialog";
import { useChatRooms } from "@/hooks/use-chat-rooms";
import { cn } from "@/lib/utils";
import type { ChatRoomTab } from "@/types/chat-room";
import { useState } from "react";

export default function ChatRoomList() {
  const [tabType, setTabType] = useState<ChatRoomTab>("JOINED");
  const { data: rooms = [], isError, isLoading } = useChatRooms(tabType);

  if (isError) {
    return <ChatRoomFeedback message="채팅방 목록을 불러오지 못했습니다." />;
  }

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "mb-6 flex flex-col gap-4 border-b border-zinc-200 pb-5",
          "sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:pb-6",
          "dark:border-zinc-800/50",
        )}
      >
        <ChatRoomTabs tabType={tabType} setTabType={setTabType} />
        <CreateChatRoomDialog />
      </div>

      {isLoading ? (
        <ChatRoomListSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {rooms.map((room) => (
            <ChatRoomCard key={room.id} chatRoom={room} />
          ))}
        </div>
      )}
    </div>
  );
}
