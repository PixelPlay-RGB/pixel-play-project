"use client"

import { useEffect, useLayoutEffect, useRef } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import type { Message } from "@/types/chat"

import { MessageItem } from "./message-item"

const TOP_PREFETCH_PX = 50

interface Props {
  messages: Message[]
  currentUserId: string
  hasMorePrevious: boolean
  isLoadingPrevious: boolean
  onReachTop: () => boolean
}

export function MessageList({
  messages,
  currentUserId,
  hasMorePrevious,
  isLoadingPrevious,
  onReachTop,
}: Props) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const previousHeightRef = useRef(0)
  const shouldRestorePositionRef = useRef(false)
  const previousLastMessageIdRef = useRef<string | null>(null)
  const isFetchingRef = useRef(false)

  const getViewport = () => {
    return scrollAreaRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]',
    ) as HTMLElement | null
  }

  useEffect(() => {
    if (!isLoadingPrevious) {
      isFetchingRef.current = false
    }
  }, [isLoadingPrevious])

  useEffect(() => {
    if (!hasMorePrevious) {
      isFetchingRef.current = false
    }
  }, [hasMorePrevious])

  useEffect(() => {
    const viewport = getViewport()
    if (!viewport) return

    const handleScroll = () => {
      const shouldPrefetch =
        viewport.scrollTop <= TOP_PREFETCH_PX &&
        hasMorePrevious &&
        !isFetchingRef.current

      if (shouldPrefetch) {
        isFetchingRef.current = true
        previousHeightRef.current = viewport.scrollHeight
        const started = onReachTop()

        if (started) {
          shouldRestorePositionRef.current = true
        } else {
          isFetchingRef.current = false
        }
      }
    }

    viewport.addEventListener("scroll", handleScroll, { passive: true })
    return () => viewport.removeEventListener("scroll", handleScroll)
  }, [hasMorePrevious, onReachTop])

  useLayoutEffect(() => {
    const viewport = getViewport()
    if (!viewport) return

    if (shouldRestorePositionRef.current) {
      const nextHeight = viewport.scrollHeight
      const heightDiff = nextHeight - previousHeightRef.current
      viewport.scrollTop = heightDiff
      shouldRestorePositionRef.current = false
      return
    }

    const lastMessageId = messages.at(-1)?.id ?? null
    const wasAppended =
      previousLastMessageIdRef.current !== null &&
      previousLastMessageIdRef.current !== lastMessageId

    if (previousLastMessageIdRef.current === null) {
      bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" })
    } else if (wasAppended) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    }

    previousLastMessageIdRef.current = lastMessageId
  }, [messages])

  return (
    <div ref={scrollAreaRef} className="min-h-0 flex-1">
      <ScrollArea className="size-full">
        <div className="flex flex-col gap-0.5 py-2">
          {isLoadingPrevious ? (
            <div className="px-2 py-1 text-center text-xs text-muted-foreground">
              이전 메시지 불러오는 중...
            </div>
          ) : null}
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isOwn={message.user_id === currentUserId}
            />
          ))}
          <div ref={bottomRef} className="h-px shrink-0" aria-hidden />
        </div>
      </ScrollArea>
    </div>
  )
}
