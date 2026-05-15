// 채팅방 메시지 단일 항목을 표시하는 컴포넌트
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { MessageQuery } from "@/types/message";
import { SystemMessageItem } from "@/components/message/system-message-item";
import { getAvatarFallbackText } from "@/utils/avatar";

interface Props {
  message: MessageQuery;
  isOwn: boolean;
}

export function MessageItem({ message, isOwn }: Props) {
  if (message.message_type === "system") {
    return <SystemMessageItem message={message} />;
  }

  const { nickname, photo_url: photoUrl } = message.user;
  const fallbackText = getAvatarFallbackText(nickname);

  if (isOwn) {
    return (
      <div className="flex justify-end px-3 py-0.5">
        <div
          className={cn(
            "max-w-80 rounded-2xl rounded-tr-sm px-3 py-1.5 text-sm leading-snug sm:max-w-md lg:max-w-lg",
            "bg-brand text-white",
          )}
        >
          <span className="wrap-break-word whitespace-pre-wrap">{message.content}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 px-3 py-0.5">
      <Avatar size={"lg"} className="mt-0.5 shrink-0">
        {photoUrl && <AvatarImage src={photoUrl} alt="" />}
        <AvatarFallback>{fallbackText}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 text-xs font-medium">{nickname}</div>
        <div
          className={cn(
            "inline-block max-w-full rounded-2xl rounded-tl-sm px-3 py-1.5 text-sm leading-snug",
            "bg-muted/60 text-foreground",
          )}
        >
          <span className="wrap-break-word whitespace-pre-wrap">{message.content}</span>
        </div>
      </div>
    </div>
  );
}
