"use client";

import { SendHorizontal } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";

import ChatEmojiPicker from "@/components/chat-room/chat-emoji-picker";
import { Button } from "@/components/ui/button";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { MESSAGE_CONTENT_MAX_LENGTH } from "@/constants/message";
import { useSendMessage } from "@/hooks/use-send-message";
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
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const submitDisabled = disabled || sendMessageMutation.isPending;

  // draft 변경마다 높이 자동 조절 + max-h 초과 시에만 스크롤 노출
  // overflow-y는 기본 hidden → max-h(8rem=128px) 초과 시 auto로 전환
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const scrollHeight = el.scrollHeight;
    el.style.height = `${scrollHeight}px`;
    // Tailwind max-h-32와 동기화: 초과 시에만 스크롤바 노출
    el.style.overflowY = scrollHeight > MAX_TEXTAREA_HEIGHT_PX ? "auto" : "hidden";
  }, [draft]);

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
        setDraft("");
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
      <ChatEmojiPicker
        disabled={submitDisabled}
        onEmojiSelect={(emoji) =>
          setDraft((prev) => (prev + emoji).slice(0, MESSAGE_CONTENT_MAX_LENGTH))
        }
      />
      <textarea
        ref={textareaRef}
        value={draft}
        disabled={disabled}
        rows={1}
        maxLength={MESSAGE_CONTENT_MAX_LENGTH}
        title={disabled ? disabledHint : undefined}
        onChange={(e) => setDraft(e.target.value.slice(0, MESSAGE_CONTENT_MAX_LENGTH))}
        onKeyDown={(e) => {
          if (submitDisabled) return;
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
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
