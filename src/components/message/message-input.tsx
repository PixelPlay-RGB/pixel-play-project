"use client";

import { SendHorizontal } from "lucide-react";
import { useRef, useState } from "react";

import ChatEmojiPicker from "@/components/chat/chat-emoji-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_MESSAGE_CODE } from "@/constants/app-message-code";
import { createClient } from "@/lib/supabase/client";
import { getAppMessageTitle, resolveSupabaseErrorCode } from "@/utils/app-message";
import { toastAppError } from "@/utils/toast-message";

interface Props {
  roomId: string;
  currentUserId: string;
  disabled?: boolean;
  disabledHint?: string;
}

export function MessageInput({ roomId, currentUserId, disabled = false, disabledHint }: Props) {
  const supabase = createClient();
  const [draft, setDraft] = useState("");
  const sendMessageLockRef = useRef(false);

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed || sendMessageLockRef.current || !currentUserId || !roomId) {
      return;
    }

    sendMessageLockRef.current = true;

    const { error } = await supabase.from("message").insert({
      chat_room_id: roomId,
      user_id: currentUserId,
      content: trimmed,
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
    <div className="border-border bg-background/95 flex shrink-0 gap-2 border-t p-2 backdrop-blur-sm">
      <ChatEmojiPicker
        disabled={disabled}
        onEmojiSelect={(emoji) => setDraft((prev) => prev + emoji)}
      />
      <Input
        value={draft}
        disabled={disabled}
        title={disabled ? disabledHint : undefined}
        onChange={(e) => setDraft(e.target.value)}
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
        className="border-border/80 bg-muted/40 flex-1 text-sm"
        aria-label="메시지 입력"
      />
      <Button
        type="button"
        size="icon-sm"
        variant="secondary"
        disabled={disabled}
        title={disabled ? disabledHint : undefined}
        onClick={() => void handleSend()}
        aria-label="전송"
      >
        <SendHorizontal className="size-4" />
      </Button>
    </div>
  );
}
