"use client";
// 모바일 채팅방 참여자 목록 Sheet를 표시하는 컴포넌트

import { MemberList } from "@/components/chat-room/member/member-list";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

interface Props {
  roomId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatRoomMemberSheet({ roomId, open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-80 flex-col gap-0 p-0">
        <SheetTitle className="sr-only">참여자 목록</SheetTitle>
        <MemberList
          roomId={roomId}
          className="h-full max-h-none w-full border-r-0 md:w-full md:border-r-0"
        />
      </SheetContent>
    </Sheet>
  );
}
