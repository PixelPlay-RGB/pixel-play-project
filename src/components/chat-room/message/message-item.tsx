"use client";
// 채팅방 메시지 단일 항목을 표시하는 컴포넌트

import { SystemMessageItem } from "@/components/chat-room/message/system-message-item";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MessageQuery } from "@/types/message";
import { getAvatarFallbackText, getAvatarImageSrc } from "@/utils/avatar";

interface Props {
  message: MessageQuery;
  isOwn: boolean;
  isGroupedWithPrevious: boolean;
  isGroupedWithNext: boolean;
  showAuthor: boolean;
  onRetryFailedSend?: (messageId: string, content: string) => void;
  onCancelFailedSend?: (messageId: string) => void;
  isSendMutationPending?: boolean;
}

function MessageBubble({
  message,
  isOwn,
  showAuthor,
  isGroupedWithNext,
}: {
  message: MessageQuery;
  isOwn: boolean;
  showAuthor: boolean;
  isGroupedWithNext: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-block max-w-full rounded-2xl px-3 py-1.5 text-sm leading-snug",
        isOwn ? "bg-brand text-white" : "bg-muted/60 text-foreground",
        showAuthor && (isOwn ? "rounded-tr-sm" : "rounded-tl-sm"),
        !showAuthor && (isOwn ? "rounded-tr-md" : "rounded-tl-md"),
        isGroupedWithNext && "rounded-br-md",
        message.clientFailed &&
          "ring-destructive/60 ring-2 ring-offset-1 ring-offset-background",
      )}
    >
      <span className="wrap-break-word whitespace-pre-wrap">{message.content}</span>
    </div>
  );
}

export function MessageItem({
  message,
  isOwn,
  isGroupedWithPrevious,
  isGroupedWithNext,
  showAuthor,
  onRetryFailedSend,
  onCancelFailedSend,
  isSendMutationPending = false,
}: Props) {
  if (message.message_type === "system") {
    return <SystemMessageItem message={message} />;
  }

  const { nickname, photo_url: photoUrl } = message.user;
  const fallbackText = getAvatarFallbackText(nickname);
  const avatarSrc = getAvatarImageSrc(photoUrl);
  const showFailedActions =
    isOwn &&
    message.clientFailed &&
    onRetryFailedSend != null &&
    onCancelFailedSend != null;

  if (isOwn) {
    return (
      <div
        className={cn("flex justify-end px-3 pb-0.5", isGroupedWithPrevious ? "pt-0.5" : "pt-2")}
      >
        <div className={cn("flex max-w-80 items-end gap-2 sm:max-w-md lg:max-w-lg")}>
          {showFailedActions ? (
            <div className="flex shrink-0 flex-nowrap items-center gap-1.5 pb-0.5">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-7 text-xs"
                disabled={isSendMutationPending}
                onClick={() => onRetryFailedSend(message.id, message.content)}
              >
                재전송
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-7 text-xs"
                disabled={isSendMutationPending}
                onClick={() => onCancelFailedSend(message.id)}
              >
                취소
              </Button>
            </div>
          ) : null}
          <div className="min-w-0 shrink">
            <MessageBubble
              message={message}
              isOwn
              showAuthor={showAuthor}
              isGroupedWithNext={isGroupedWithNext}
            />
          </div>
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
        <MessageBubble
          message={message}
          isOwn={false}
          showAuthor={showAuthor}
          isGroupedWithNext={isGroupedWithNext}
        />
      </div>
    </div>
  );
}
