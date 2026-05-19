// 채팅방 시스템 메시지를 중앙 안내 형태로 표시하는 컴포넌트
import { Calendar } from "lucide-react";

import { MESSAGE_DATE_DIVIDER_PREFIX } from "@/constants/message/message";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/message/message";

interface Props {
  message: Message;
}

export function SystemMessageItem({ message }: Props) {
  const isDateDivider = message.content.startsWith(MESSAGE_DATE_DIVIDER_PREFIX);
  const displayContent = isDateDivider
    ? message.content.slice(MESSAGE_DATE_DIVIDER_PREFIX.length)
    : message.content;

  return (
    <div className="flex justify-center px-3 py-1.5">
      <p
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-3 py-1 text-center text-xs",
          "bg-muted/70 text-muted-foreground",
        )}
      >
        {isDateDivider && <Calendar className="size-3 shrink-0" />}
        {displayContent}
      </p>
    </div>
  );
}
