// 채팅방 메시지 단일 항목을 표시하는 컴포넌트
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { MessageQuery } from "@/types/message";
import { SystemMessageItem } from "@/components/chat-room/message/system-message-item";
import { getAvatarFallbackText } from "@/utils/avatar";

interface Props {
  message: MessageQuery;
  isOwn: boolean;
  isGroupedWithPrevious: boolean;
  isGroupedWithNext: boolean;
  showAuthor: boolean;
}

export function MessageItem({
  message,
  isOwn,
  isGroupedWithPrevious,
  isGroupedWithNext,
  showAuthor,
}: Props) {
  if (message.message_type === "system") {
    return <SystemMessageItem message={message} />;
  }

  const { nickname, photo_url: photoUrl } = message.user;
  const fallbackText = getAvatarFallbackText(nickname);

  if (isOwn) {
    return (
      <div
        className={cn("flex justify-end px-3 pb-0.5", isGroupedWithPrevious ? "pt-0.5" : "pt-2")}
      >
        <div
          className={cn(
            "max-w-80 rounded-2xl px-3 py-1.5 text-sm leading-snug sm:max-w-md lg:max-w-lg",
            "bg-brand text-white",
            !isGroupedWithPrevious && "rounded-tr-sm",
            isGroupedWithPrevious && "rounded-tr-md",
            isGroupedWithNext && "rounded-br-md",
          )}
        >
          <span className="wrap-break-word whitespace-pre-wrap">{message.content}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2 px-3 pb-0.5", isGroupedWithPrevious ? "pt-0.5" : "pt-2")}>
      {showAuthor ? (
        <Avatar size="lg" className="mt-0.5 shrink-0">
          {photoUrl && <AvatarImage src={photoUrl} alt="" />}
          <AvatarFallback>{fallbackText}</AvatarFallback>
        </Avatar>
      ) : (
        <div aria-hidden className="w-10 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        {showAuthor ? <div className="mb-1.5 text-xs font-medium">{nickname}</div> : null}
        <div
          className={cn(
            "inline-block max-w-full rounded-2xl px-3 py-1.5 text-sm leading-snug",
            "bg-muted/60 text-foreground",
            showAuthor && "rounded-tl-sm",
            !showAuthor && "rounded-tl-md",
            isGroupedWithNext && "rounded-bl-md",
          )}
        >
          <span className="wrap-break-word whitespace-pre-wrap">{message.content}</span>
        </div>
      </div>
    </div>
  );
}
