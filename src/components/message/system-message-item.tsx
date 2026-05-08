"use client";

// 채팅방 시스템 메시지를 중앙 안내 형태로 표시하는 컴포넌트
import type { Message } from "@/types/message";

interface Props {
  message: Message;
}

export function SystemMessageItem({ message }: Props) {
  return (
    <div className="flex justify-center px-3 py-1.5">
      <p className="bg-muted/70 text-muted-foreground rounded-full px-3 py-1 text-center text-xs">
        {message.content}
      </p>
    </div>
  );
}
