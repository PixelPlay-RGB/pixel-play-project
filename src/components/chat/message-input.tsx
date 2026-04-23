"use client"

import { SendHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import ChatEmojiPicker from "./chat-emoji-picker"

interface Props {
  draft: string
  onDraftChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
  disabledHint?: string
}

export function MessageInput({
  draft,
  onDraftChange,
  onSend,
  disabled = false,
  disabledHint,
}: Props) {
  return (
    <div className="flex shrink-0 gap-2 border-t border-border bg-background/95 p-2 backdrop-blur-sm">
      <ChatEmojiPicker
        disabled={disabled}
        onEmojiSelect={(emoji) => onDraftChange(draft + emoji)}
      />
      <Input
        value={draft}
        disabled={disabled}
        title={disabled ? disabledHint : undefined}
        onChange={(e) => onDraftChange(e.target.value)}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            onSend()
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
        onClick={onSend}
        aria-label="전송"
      >
        <SendHorizontal className="size-4" />
      </Button>
    </div>
  )
}
