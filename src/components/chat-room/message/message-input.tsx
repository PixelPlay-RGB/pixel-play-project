"use client";
// message-input 컴포넌트를 제공합니다.

import { SendHorizontal } from "lucide-react";
import { type FormEvent, useEffect, useRef } from "react";

import ChatEmojiPicker from "@/components/chat-room/chat-emoji-picker";
import { useChatRoomPresenceContext } from "@/components/chat-room/chat-room-presence-provider";
import { Button } from "@/components/ui/button";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { CHAT_ROOM_TYPING_DRAFT_POLL_INTERVAL_MS } from "@/constants/chat-room-presence";
import { MESSAGE_CONTENT_MAX_LENGTH } from "@/constants/message";
import { useAutoResizeTextarea } from "@/hooks/common/use-auto-resize-textarea";
import { useMessageDraft } from "@/hooks/message/use-message-draft";
import { useSendMessage } from "@/hooks/message/use-send-message";
import { cn } from "@/lib/utils";
import { messageContentSchema } from "@/lib/zod/message";
import { getAppMessageTitle } from "@/utils/app-message";
import { toastAppError } from "@/utils/toast-message";

interface Props {
  roomId: string;
  disabled?: boolean;
  disabledHint?: string;
}

const MAX_TEXTAREA_HEIGHT_PX = 128; // max-h-32 (8rem)

export function MessageInput({ roomId, disabled = false, disabledHint }: Props) {
  const sendMessageMutation = useSendMessage(roomId);
  const { setTyping } = useChatRoomPresenceContext();
  const { draft, setDraft, appendDraft, clearDraft } = useMessageDraft(MESSAGE_CONTENT_MAX_LENGTH);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastObservedDraftRef = useRef("");
  const submitDisabled = disabled || sendMessageMutation.isPending;

  useAutoResizeTextarea({
    textareaRef,
    value: draft,
    maxHeightPx: MAX_TEXTAREA_HEIGHT_PX,
  });

  useEffect(() => {
    setTyping(!disabled && draft.length > 0);
  }, [disabled, draft, setTyping]);

  useEffect(() => {
    return () => {
      setTyping(false);
    };
  }, [setTyping]);

  useEffect(() => {
    const draftPollInterval = window.setInterval(() => {
      const currentDraft = textareaRef.current?.value ?? "";

      if (currentDraft === lastObservedDraftRef.current) {
        if (currentDraft.length === 0) {
          setTyping(false);
        }

        return;
      }

      lastObservedDraftRef.current = currentDraft;

      if (currentDraft.length === 0) {
        setTyping(false);
        return;
      }

      setTyping(!disabled);
    }, CHAT_ROOM_TYPING_DRAFT_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(draftPollInterval);
    };
  }, [disabled, setTyping]);

  const syncTypingStatus = (value: string) => {
    if (disabled) {
      setTyping(false);
      return;
    }

    setTyping(value.length > 0);
  };

  const handleDraftChange = (value: string) => {
    lastObservedDraftRef.current = value;
    setDraft(value);
    syncTypingStatus(value);
  };

  const handleEmojiSelect = (emoji: string) => {
    appendDraft(emoji);
    setTyping(!disabled);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

    try {
      const result = await sendMessageMutation.mutateAsync(content);

      if (result.success) {
        clearDraft(content);
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
        onBeforeInput={() => setTyping(!disabled)}
        onInput={(e) => syncTypingStatus(e.currentTarget.value)}
        onPaste={() => setTyping(!disabled)}
        onCompositionStart={() => setTyping(!disabled)}
        onCompositionEnd={(e) => syncTypingStatus(e.currentTarget.value)}
        onFocus={() => setTyping(!disabled && draft.length > 0)}
        onBlur={() => setTyping(false)}
        onKeyDown={(e) => {
          if (submitDisabled) return;
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
            return;
          }

          if ((e.key === "Backspace" || e.key === "Delete") && e.currentTarget.value.length <= 1) {
            setTyping(false);
            return;
          }

          if (e.key.length === 1 || e.key === "Backspace" || e.key === "Delete") {
            setTyping(true);
          }
        }}
        onKeyUp={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            return;
          }

          syncTypingStatus(e.currentTarget.value);
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
