"use client"

import { useEffect, useRef } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import type { Message } from "@/types/chat"

import { MessageItem } from "./message-item"

interface Props {
  messages: Message[]
  displayNameByUserId: Record<string, string>
  currentUserId: string
}

export function MessageList({
  messages,
  displayNameByUserId,
  currentUserId,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages])

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="flex flex-col gap-0.5 py-2">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            displayName={
              displayNameByUserId[message.userId] ?? message.userId.slice(0, 8)
            }
            isOwn={message.userId === currentUserId}
          />
        ))}
        <div ref={bottomRef} className="h-px shrink-0" aria-hidden />
      </div>
    </ScrollArea>
  )
}
