"use client";

// 채팅방 검색 결과를 Supabase RPC로 조회합니다.
import { QUERY_KEYS } from "@/constants/query-keys";
import { CHAT_SEARCH_RESULT_LIMIT } from "@/constants/search";
import { createClient } from "@/lib/supabase/client";
import type { ChatSearchResult, ChatSearchSection } from "@/types/search";
import { useInfiniteQuery } from "@tanstack/react-query";

function isChatSearchSection(section: string): section is ChatSearchSection {
  return section === "title" || section === "owner";
}

function isChatSearchResult(result: { section: string }): result is ChatSearchResult {
  return isChatSearchSection(result.section);
}

async function fetchChatRoomSearchResults(
  query: string,
  section: ChatSearchSection,
  offset: number,
): Promise<ChatSearchResult[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("search_chat_rooms", {
    p_query: query,
    p_limit: CHAT_SEARCH_RESULT_LIMIT,
    p_section: section,
    p_offset: offset,
  });

  if (error) {
    throw error;
  }

  return (data ?? []).filter(isChatSearchResult);
}

export function useChatRoomSearch(query: string, section: ChatSearchSection) {
  const trimmedQuery = query.trim();

  return useInfiniteQuery<ChatSearchResult[]>({
    queryKey: QUERY_KEYS.chat.search(trimmedQuery, section),
    queryFn: ({ pageParam }) =>
      fetchChatRoomSearchResults(trimmedQuery, section, Number(pageParam)),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.at(-1)?.has_more ? allPages.length * CHAT_SEARCH_RESULT_LIMIT : undefined,
    enabled: trimmedQuery.length > 0,
  });
}
