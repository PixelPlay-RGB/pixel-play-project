"use client"

import { SendHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import ChatEmojiPicker from "./chat-emoji-picker"

interface Props {
  draft: string
  onDraftChange: (value: string) => void
  onSend: () => void
}

export function MessageInput({ draft, onDraftChange, onSend }: Props) {
  return (
    <div className="flex shrink-0 gap-2 border-t border-border bg-background/95 p-2 backdrop-blur-sm">
      <ChatEmojiPicker
        onEmojiSelect={(emoji) => onDraftChange(draft + emoji)}
      />
      <Input
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            onSend()
          }
        }}
        placeholder="채팅하기"
        className="flex-1 border-border/80 bg-muted/40 text-sm"
        aria-label="메시지 입력"
      />
      <Button
        type="button"
        size="icon-sm"
        variant="secondary"
        onClick={onSend}
        aria-label="전송"
      >
        <SendHorizontal className="size-4" />
      </Button>
    </div>
  )
}
