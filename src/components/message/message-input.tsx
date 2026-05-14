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
import { MESSAGE_CONTENT_MAX_LENGTH } from "@/constants/message";
import { messageContentSchema } from "@/lib/zod/message";
import { toast } from "sonner";

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
    if (sendMessageLockRef.current || !currentUserId || !roomId) {
      return;
    }

    const parsed = messageContentSchema.safeParse(draft);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast.error(first?.message ?? "입력값을 확인해주세요.");
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
    <div className="border-border bg-background/95 flex shrink-0 items-center gap-2 border-t px-3 py-2 backdrop-blur-sm">
      <ChatEmojiPicker
        disabled={disabled}
        onEmojiSelect={(emoji) =>
          setDraft((prev) => (prev + emoji).slice(0, MESSAGE_CONTENT_MAX_LENGTH))
        }
      />
      <Input
        value={draft}
        disabled={disabled}
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
        className="h-9 flex-1 rounded-xl border-border/60 bg-muted/30 py-0 text-sm placeholder:text-muted-foreground/60"
        aria-label="메시지 입력"
      />
      <Button
        type="button"
        size="icon-lg"
        variant="ghost"
        disabled={disabled}
        title={disabled ? disabledHint : undefined}
        onClick={() => void handleSend()}
        aria-label="전송"
        className="shrink-0 text-brand hover:bg-brand/10 hover:text-brand"
      >
        <SendHorizontal className="size-5" />
      </Button>
    </div>
  );
}
