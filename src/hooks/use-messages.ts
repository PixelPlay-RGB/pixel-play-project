"use client";

import { useEffect } from "react";

import { useInfiniteQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/query-keys";
import { createClient } from "@/lib/supabase/client";
import type { MessageQuery } from "@/types/message";
import { MESSAGE_PAGE_SIZE } from "@/constants/message";

interface MessagesPage {
  items: MessageQuery[];
  nextCursor?: string;
}

export default function useMessages(chatRoomId: string, isActive = true) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: QUERY_KEYS.chat.messages(chatRoomId),
    initialPageParam: undefined as string | undefined,
    enabled: !!chatRoomId && isActive,
    staleTime: 1000 * 60,
    queryFn: async ({ pageParam }): Promise<MessagesPage> => {
      let request = supabase
        .from("message")
        .select("*, user:user_id!inner(nickname, photo_url)")
        .eq("chat_room_id", chatRoomId)
        .order("created_at", { ascending: false })
        .limit(MESSAGE_PAGE_SIZE);

      if (pageParam) {
        request = request.lt("created_at", pageParam);
      }

      const { data, error } = await request;

      if (error) throw error;

      const items: MessageQuery[] = data ?? [];
      const nextCursor =
        items.length === MESSAGE_PAGE_SIZE ? items[items.length - 1]?.created_at : undefined;

      return { items, nextCursor };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (data) => {
      const descending = data.pages.flatMap((page) => page.items);
      return descending.filter((message, index, list) => {
        return list.findIndex((item) => item.id === message.id) === index;
      });
    },
  });

  useEffect(() => {
    if (!chatRoomId || !isActive) return;

    const channel = supabase
      .channel(`room-message-${chatRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message",
          filter: `chat_room_id=eq.${chatRoomId}`,
        },
        async (payload) => {
          if (!payload.new || typeof payload.new !== "object") return;

          const messageId = String(payload.new.id ?? "");
          if (!messageId) return;

          const { data: nextMessage, error } = await supabase
            .from("message")
            .select("*, user:user_id!inner(nickname, photo_url)")
            .eq("id", messageId)
            .single();

          if (error || !nextMessage) return;

          queryClient.setQueryData<InfiniteData<MessagesPage>>(
            QUERY_KEYS.chat.messages(chatRoomId),
            (previous) => {
              if (!previous) return previous;

              const alreadyExists = previous.pages.some((page) =>
                page.items.some((item) => item.id === nextMessage.id),
              );

              if (alreadyExists) return previous;

              const [firstPage, ...restPages] = previous.pages;
              if (!firstPage) return previous;

              return {
                ...previous,
                pages: [{ ...firstPage, items: [nextMessage, ...firstPage.items] }, ...restPages],
              };
            },
          );
        },
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [queryClient, chatRoomId, supabase, isActive]);

  const messages = query.data ?? [];

  return {
    messages,
    hasMorePrevious: query.hasNextPage ?? false,
    isLoadingPrevious: query.isFetchingNextPage,
    isLoadingInitial: query.isLoading,
    error: query.error,
    fetchPreviousPage: query.fetchNextPage,
  };
}
