"use client"

import { useEffect, useMemo } from "react"

import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query"

import { MESSAGE_PAGE_SIZE } from "@/lib/chat"
import { createClient } from "@/lib/supabase/client"
import type { Message } from "@/types/message"

interface MessagesPage {
  items: Message[]
  nextCursor?: string
}

const queryKeyByRoomId = (roomId: string) => ["messages", roomId] as const

export default function useMessages(roomId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const query = useInfiniteQuery({
    queryKey: queryKeyByRoomId(roomId),
    initialPageParam: undefined as string | undefined,
    enabled: !!roomId,
    staleTime: 1000 * 60,
    queryFn: async ({ pageParam }): Promise<MessagesPage> => {
      let request = supabase
        .from("message")
        .select("*")
        .eq("chat_room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(MESSAGE_PAGE_SIZE)

      if (pageParam) {
        request = request.lt("created_at", pageParam)
      }

      const { data, error } = await request

      if (error) throw error

      const items = (data ?? []) as Message[]
      const nextCursor =
        items.length === MESSAGE_PAGE_SIZE
          ? items[items.length - 1]?.created_at
          : undefined

      return { items, nextCursor }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  useEffect(() => {
    if (!roomId) return

    const channel = supabase
      .channel(`room-message-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message",
          filter: `chat_room_id=eq.${roomId}`,
        },
        (payload) => {
          if (!payload.new || typeof payload.new !== "object") return

          const nextMessage = payload.new as Message
          const messageId = String(nextMessage.id ?? "")
          if (!messageId) return

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

  const loadPrevious = async () => {
    if (!query.hasNextPage || query.isFetchingNextPage) return
    await query.fetchNextPage()
  }

  return {
    messages,
    hasMorePrevious: query.hasNextPage ?? false,
    isLoadingPrevious: query.isFetchingNextPage,
    isLoadingInitial: query.isLoading,
    error: query.error,
    loadPrevious,
  }
}
