"use client";
// 채팅방 메시지 단일 항목을 표시하는 컴포넌트

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { MessageListItem } from "@/types/message/message";
import { FailedMessageActions } from "@/components/chat-room/message/failed-message-actions";
import { SystemMessageItem } from "@/components/chat-room/message/system-message-item";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/profile/avatar";

interface Props {
  message: MessageListItem;
  isOwn: boolean;
  isGroupedWithPrevious: boolean;
  isGroupedWithNext: boolean;
  showAuthor: boolean;
  isRetryPending: boolean;
  onRetry: () => void;
  onCancel: () => void;
}

export function MessageItem({
  message,
  isOwn,
  isGroupedWithPrevious,
  isGroupedWithNext,
  showAuthor,
  isRetryPending,
  onRetry,
  onCancel,
}: Props) {
  if (message.message_type === "system") {
    return <SystemMessageItem message={message} />;
  }

  const { nickname, photo_url: photoUrl } = message.user;
  const fallbackText = getAvatarFallbackText(nickname);
  const avatarSrc = getAvatarImageSrc(photoUrl);

  if (isOwn) {
    const isSending = message.clientStatus === "sending";
    const isFailed = message.clientStatus === "failed";

    return (
      <div
        className={cn("flex justify-end px-3 pb-0.5", isGroupedWithPrevious ? "pt-0.5" : "pt-2")}
      >
        <div className="max-w-80 sm:max-w-md lg:max-w-lg">
          <div
            className={cn(
              "rounded-2xl px-3 py-1.5 text-sm leading-snug",
              "bg-brand text-white",
              isSending && "opacity-70",
              isFailed && "ring-destructive/40 bg-destructive/10 text-destructive ring-1",
              !isGroupedWithPrevious && "rounded-tr-sm",
              isGroupedWithPrevious && "rounded-tr-md",
              isGroupedWithNext && "rounded-br-md",
            )}
            aria-label={isFailed ? "전송 실패 메시지" : undefined}
          >
            <span className="wrap-break-word whitespace-pre-wrap">{message.content}</span>
          </div>
          {isFailed ? (
            <FailedMessageActions disabled={isRetryPending} onRetry={onRetry} onCancel={onCancel} />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2 px-3 pb-0.5", isGroupedWithPrevious ? "pt-0.5" : "pt-2")}>
      {showAuthor ? (
        <Avatar size="lg" className="mt-0.5 shrink-0">
          <AvatarImage src={avatarSrc} alt={`${nickname}의 프로필 사진`} />
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
