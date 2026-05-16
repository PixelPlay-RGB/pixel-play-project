"use client";

import { SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import ChatEmojiPicker from "@/components/chat-room/chat-emoji-picker";
import { Button } from "@/components/ui/button";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { createClient } from "@/lib/supabase/client";
import { getAppMessageTitle, resolveSupabaseErrorCode } from "@/utils/app-message";
import { toastAppError } from "@/utils/toast-message";
import { MESSAGE_CONTENT_MAX_LENGTH } from "@/constants/message";
import { messageContentSchema } from "@/lib/zod/message";
import { cn } from "@/lib/utils";

interface Props {
  roomId: string;
  currentUserId: string;
  disabled?: boolean;
  disabledHint?: string;
}

const MAX_TEXTAREA_HEIGHT_PX = 128; // max-h-32 (8rem)

export function MessageInput({ roomId, currentUserId, disabled = false, disabledHint }: Props) {
  const supabase = createClient();
  const [draft, setDraft] = useState("");
  const sendMessageLockRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleSend = async () => {
    if (sendMessageLockRef.current || !currentUserId || !roomId) {
      return;
    }

    const parsed = messageContentSchema.safeParse(draft);
    if (!parsed.success) {
      toastAppError(APP_MESSAGE_CODE.error.message.invalidInput);
      return;
    }

    const content = parsed.data;

    sendMessageLockRef.current = true;

    const { error } = await supabase.from("message").insert({
      chat_room_id: roomId,
      user_id: currentUserId,
      content,
    });

    if (error) {
      console.error(error);
      toastAppError(resolveSupabaseErrorCode(error, APP_MESSAGE_CODE.error.message.sendFailed));
      sendMessageLockRef.current = false;
      return;
    }

    setDraft("");
    sendMessageLockRef.current = false;
  };

  return (
    <div className="border-border bg-background/95 flex shrink-0 items-end gap-2 border-t px-3 py-2 backdrop-blur-sm">
      <ChatEmojiPicker
        disabled={disabled}
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
          if (disabled) return;
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void handleSend();
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
        type="button"
        size="icon-lg"
        variant="ghost"
        disabled={disabled}
        title={disabled ? disabledHint : undefined}
        onClick={() => void handleSend()}
        aria-label="전송"
        className="text-brand hover:bg-brand/10 hover:text-brand shrink-0"
      >
        <SendHorizontal className="size-5" />
      </Button>
    </div>
  );
}
