"use client";

// 채팅방 상세 화면의 상단 제목과 참여자 진입 버튼을 표시하는 헤더

import { Users } from "lucide-react";

import { ChatRoomMenu } from "@/components/chat-room/chat-room-menu";
import { Button } from "@/components/ui/button";
import { useChatRoomDetail } from "@/hooks/use-chat-room-detail";

interface Props {
  roomId: string;
  onOpenMembers: () => void;
}

export function ChatRoomHeader({ roomId, onOpenMembers }: Props) {
  const { room, roomPending } = useChatRoomDetail(roomId);

  return (
    <div className="border-border/50 bg-muted/20 flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">
        {roomPending ? "불러오는 중…" : (room?.title ?? "채팅방")}
      </h1>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon-lg"
          className="gap-1.5 md:pointer-events-none md:cursor-default"
          onClick={onOpenMembers}
          aria-label="참여자 목록"
        >
          <Users className="size-4" />
          <span className="text-sm font-medium">{room?.current_member ?? 0}</span>
        </Button>
        <ChatRoomMenu roomId={roomId} />
      </div>
    </div>
  );
}
