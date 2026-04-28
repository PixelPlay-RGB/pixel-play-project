"use client"

import { useCallback, useLayoutEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { MemberDisplayByUserId } from "@/types/chatroommember"
import type { Message } from "@/types/message"
import { MessageItem } from "./message-item"

const TOP_PREFETCH_PX = 50

interface Props {
  messages: Message[]
  currentUserId: string
  memberDisplayByUserId: MemberDisplayByUserId
  hasMorePrevious: boolean
  isLoadingPrevious: boolean
  onReachTop: () => boolean
}

export function MessageList({
  messages,
  currentUserId,
  memberDisplayByUserId,
  hasMorePrevious,
  isLoadingPrevious,
  onReachTop,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const prevFirstIdRef = useRef<string | null>(null)
  const prevLastIdRef = useRef<string | null>(null)
  const prevScrollHeightRef = useRef(0)

  const scrollViewportToBottom = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    viewport.scrollTop = viewport.scrollHeight - viewport.clientHeight
  }, [])

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const firstId = messages[0]?.id ?? null
    const lastId = messages.at(-1)?.id ?? null
    const prevFirst = prevFirstIdRef.current
    const prevLast = prevLastIdRef.current

    if (prevLast === null) {
      scrollViewportToBottom()
    } else if (lastId !== prevLast) {
      scrollViewportToBottom()
    } else if (firstId !== prevFirst && lastId === prevLast) {
      const diff = viewport.scrollHeight - prevScrollHeightRef.current
      if (diff !== 0) {
        viewport.scrollTop += diff
      }
    }

    prevFirstIdRef.current = firstId
    prevLastIdRef.current = lastId
    prevScrollHeightRef.current = viewport.scrollHeight
  }, [messages, scrollViewportToBottom])

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const viewport = e.currentTarget
      const isNearTop = viewport.scrollTop <= TOP_PREFETCH_PX

      if (isNearTop && hasMorePrevious && !isLoadingPrevious) {
        onReachTop()
      }
    },
    [hasMorePrevious, isLoadingPrevious, onReachTop],
  )

  // 메시지 배열을 역순으로 뒤집어 최신 메시지가 아래에 오도록 합니다.
  const reversedMessages = [...messages].reverse();

  return (
    <div className="min-h-0 flex-1 overflow-hidden">
      <ScrollArea
        ref={viewportRef}
        className="size-full"
        onScroll={handleScroll}
      >
        <div className="flex flex-col-reverse gap-0.5 py-2">
          {/* 하단(배열의 끝)부터 렌더링됨 */}
          {reversedMessages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isOwn={message.user_id === currentUserId}
              memberDisplayByUserId={memberDisplayByUserId}
            />
          ))}

          {/* 로딩 표시가 목록 최상단(reverse 기준 하단)에 위치하게 됨 */}
          {isLoadingPrevious && (
            <div className="px-2 py-1 text-center text-xs text-muted-foreground">
              이전 메시지 불러오는 중...
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}