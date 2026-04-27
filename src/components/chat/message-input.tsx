"use client"

import { useCallback, useRef, useState } from "react"
import { SendHorizontal } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ERROR_MESSAGES } from "@/constants/errors"
import { createClient } from "@/lib/supabase/client"

import ChatEmojiPicker from "./chat-emoji-picker"

interface Props {
  roomId: string
  currentUserId: string
  disabled?: boolean
  disabledHint?: string
}

export function MessageInput({
  roomId,
  currentUserId,
  disabled = false,
  disabledHint,
}: Props) {
  const supabase = createClient()
  const [draft, setDraft] = useState("")
  const sendMessageLockRef = useRef(false)

  const handleSend = useCallback(async () => {
    const trimmed = draft.trim()
    if (
      !trimmed ||
      sendMessageLockRef.current ||
      !currentUserId ||
      !roomId
    ) {
      return
    }

    sendMessageLockRef.current = true

    const { error } = await supabase.from("message").insert({
      chat_room_id: roomId,
      user_id: currentUserId,
      content: trimmed,
    })

    if (error) {
      console.error(error)
      const errorConfig =
        ERROR_MESSAGES[error.code] || ERROR_MESSAGES.DEFAULT
      toast.error(errorConfig.title, {
        description: errorConfig.description,
      })
      sendMessageLockRef.current = false
      return
    }

    setDraft("")
    sendMessageLockRef.current = false
  }, [currentUserId, draft, roomId, supabase])

  return (
    <div className="flex shrink-0 gap-2 border-t border-border bg-background/95 p-2 backdrop-blur-sm">
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
            e.preventDefault()
            void handleSend()
          }
        }}
        placeholder={
          disabled ? disabledHint ?? "메시지를 보낼 수 없습니다" : "채팅하기"
        }
        className="flex-1 border-border/80 bg-muted/40 text-sm"
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
  )
}
