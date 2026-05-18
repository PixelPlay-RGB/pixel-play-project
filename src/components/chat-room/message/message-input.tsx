"use client";
// message-input 컴포넌트를 제공합니다.

import { SendHorizontal } from "lucide-react";
import { type SubmitEvent, useCallback, useEffect, useRef } from "react";

import ChatEmojiPicker from "@/components/chat-room/chat-emoji-picker";
import { useChatRoomPresenceContext } from "@/components/chat-room/chat-room-presence-provider";
import { Button } from "@/components/ui/button";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { MESSAGE_CONTENT_MAX_LENGTH } from "@/constants/message";
import { useAutoResizeTextarea } from "@/hooks/common/use-auto-resize-textarea";
import { useMessageDraft } from "@/hooks/message/use-message-draft";
import type { useSendMessage } from "@/hooks/message/use-send-message";
import { cn } from "@/lib/utils";
import { messageContentSchema } from "@/lib/zod/message";
import { getAppMessageTitle } from "@/utils/app-message";
import { toastAppError } from "@/utils/toast-message";

interface Props {
  roomId: string;
  sendMessageMutation: ReturnType<typeof useSendMessage>;
  disabled?: boolean;
  disabledHint?: string;
}

const MAX_TEXTAREA_HEIGHT_PX = 128; // max-h-32 (8rem)

export function MessageInput({
  roomId,
  sendMessageMutation,
  disabled = false,
  disabledHint,
}: Props) {
  const { setTyping } = useChatRoomPresenceContext();
  const { draft, setDraft, appendDraft, clearDraft } = useMessageDraft(MESSAGE_CONTENT_MAX_LENGTH);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const latestDraftRef = useRef("");
  const submitDisabled = disabled || sendMessageMutation.isPending;

  useAutoResizeTextarea({
    textareaRef,
    value: draft,
    maxHeightPx: MAX_TEXTAREA_HEIGHT_PX,
  });

  const syncTypingStatus = useCallback(
    (value: string) => {
      const nextDraft = value.slice(0, MESSAGE_CONTENT_MAX_LENGTH);

      latestDraftRef.current = nextDraft;
      setTyping(!disabled && nextDraft.length > 0);

      return nextDraft;
    },
    [disabled, setTyping],
  );

  useEffect(() => {
    return () => {
      setTyping(false);
    };
  }, [setTyping]);

  useEffect(() => {
    if (disabled) {
      setTyping(false);
    }
  }, [disabled, setTyping]);

  const handleDraftChange = (value: string) => {
    const nextDraft = syncTypingStatus(value);
    setDraft(nextDraft);
  };

  const handleEmojiSelect = (emoji: string) => {
    const nextDraft = syncTypingStatus(latestDraftRef.current + emoji);
    appendDraft(emoji);
    latestDraftRef.current = nextDraft;
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitDisabled || !roomId) {
      return;
    }

    const parsed = messageContentSchema.safeParse(draft);
    if (!parsed.success) {
      toastAppError(APP_MESSAGE_CODE.error.message.invalidInput);
      return;
    }

    const content = parsed.data;

    setTyping(false);

    try {
      const result = await sendMessageMutation.sendMessage(content);

      if (result.success) {
        clearDraft(content);

        if (latestDraftRef.current === content) {
          latestDraftRef.current = "";
        }
      }
    } catch {
      return;
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-border bg-background/95 flex shrink-0 items-end gap-2 border-t px-3 py-2 backdrop-blur-sm"
    >
      <ChatEmojiPicker disabled={submitDisabled} onEmojiSelect={handleEmojiSelect} />
      <textarea
        ref={textareaRef}
        value={draft}
        disabled={disabled}
        rows={1}
        maxLength={MESSAGE_CONTENT_MAX_LENGTH}
        title={disabled ? disabledHint : undefined}
        onChange={(e) => handleDraftChange(e.target.value)}
        onCompositionEnd={(e) => handleDraftChange(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (submitDisabled) return;
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
            return;
          }
        }}
        placeholder={
          disabled
            ? (disabledHint ?? getAppMessageTitle(APP_MESSAGE_CODE.error.chatRoom.inputLocked))
            : "채팅하기"
        }
        aria-label="메시지 입력"
        className={cn(
          "flex-1 resize-none overflow-y-hidden rounded-xl px-3 py-2 text-sm leading-normal",
          "max-h-32 min-h-9",
          "border-border/60 bg-muted/30 border",
          "placeholder:text-muted-foreground/60",
          "focus-visible:ring-ring/60 outline-none focus-visible:ring-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // 스크롤바: max-h 초과 시에만 노출, 브랜드 톤에 맞춘 thin 디자인
          "[&::-webkit-scrollbar]:w-1",
          "[&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:rounded-full",
          "[&::-webkit-scrollbar-thumb]:bg-border",
          "[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/40",
        )}
      />
      <Button
        type="submit"
        size="icon-lg"
        variant="ghost"
        disabled={submitDisabled}
        title={disabled ? disabledHint : undefined}
        aria-label="전송"
        className="text-brand hover:bg-brand/10 hover:text-brand shrink-0"
      >
        <SendHorizontal className="size-5" />
      </Button>
    </form>
  );
}
