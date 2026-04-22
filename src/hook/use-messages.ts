"use client"

import { useEffect, useMemo } from "react"

import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query"

import { MESSAGE_PAGE_SIZE } from "@/lib/chat-constants"
import { createClient } from "@/lib/supabase/client"
import type { Message } from "@/types/chat"

interface MessageQueryRow {
  id: string
  room_id: string
  user_id: string
  content: string
  created_at: string
  user: {
    id: string
    display_name: string | null
  } | null
}

interface MessagesPage {
  items: Message[]
  nextCursor?: string
}

const queryKeyByRoomId = (roomId: string) => ["messages", roomId] as const

function mapRowToMessage(row: MessageQueryRow): Message {
  return {
    id: row.id,
    roomId: row.room_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    displayName: row.user?.display_name ?? row.user_id.slice(0, 8),
  }
}

export default function useMessages(roomId: string) {
  const supabase = useMemo(() => createClient(), [])
  const queryClient = useQueryClient()

  const query = useInfiniteQuery({
    queryKey: queryKeyByRoomId(roomId),
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60,
    queryFn: async ({ pageParam }) => {
      let request = supabase
        .from("message")
        .select(
          "id, room_id, user_id, content, created_at, user:user_id(id, display_name)",
        )
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(MESSAGE_PAGE_SIZE)

      if (pageParam) {
        request = request.lt("created_at", pageParam)
      }

      const { data, error } = await request.returns<MessageQueryRow[]>()

      if (error) throw error

      const items = (data ?? []).map(mapRowToMessage)
      const nextCursor =
        items.length === MESSAGE_PAGE_SIZE
          ? items[items.length - 1]?.createdAt
          : undefined

      return { items, nextCursor } satisfies MessagesPage
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  useEffect(() => {
    const channel = supabase
      .channel(`room-message-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const messageId = String(payload.new.id ?? "")
          if (!messageId) return

          const { data, error } = await supabase
            .from("message")
            .select(
              "id, room_id, user_id, content, created_at, user:user_id(id, display_name)",
            )
            .eq("id", messageId)
            .single()
            .returns<MessageQueryRow>()

          if (error || !data) {
            if (error) {
              console.error(error)
            }
            return
          }

          const nextMessage = mapRowToMessage(data)

          queryClient.setQueryData<InfiniteData<MessagesPage>>(
            queryKeyByRoomId(roomId),
            (previous) => {
              if (!previous) return previous

              const alreadyExists = previous.pages.some((page) =>
                page.items.some((item) => item.id === nextMessage.id),
              )

              if (alreadyExists) return previous

              const [firstPage, ...restPages] = previous.pages
              if (!firstPage) return previous

              return {
                ...previous,
                pages: [
                  { ...firstPage, items: [nextMessage, ...firstPage.items] },
                  ...restPages,
                ],
              }
            },
          )
        },
      )
      .subscribe()

    return () => {
      void channel.unsubscribe()
    }
  }, [queryClient, roomId, supabase])

  const messages = useMemo(() => {
    const descending = query.data?.pages.flatMap((page) => page.items) ?? []
    const deduplicatedDescending = descending.filter((message, index, list) => {
      return list.findIndex((item) => item.id === message.id) === index
    })
    return [...deduplicatedDescending].reverse()
  }, [query.data])

  const displayNameByUserId = useMemo(() => {
    return messages.reduce<Record<string, string>>((acc, message) => {
      acc[message.userId] = message.displayName ?? message.userId.slice(0, 8)
      return acc
    }, {})
  }, [messages])

  const loadPrevious = async () => {
    if (!query.hasNextPage || query.isFetchingNextPage) return
    await query.fetchNextPage()
  }

  return {
    messages,
    displayNameByUserId,
    hasMorePrevious: query.hasNextPage ?? false,
    isLoadingPrevious: query.isFetchingNextPage,
    isLoadingInitial: query.isLoading,
    error: query.error,
    loadPrevious,
  }
}
