"use client";
// 채팅방 검색 결과 페이지에 필요한 섹션별 검색 상태를 제공합니다.
import { QUERY_KEYS } from "@/constants/common/query-keys";
import { CHAT_SEARCH_RESULT_LIMIT } from "@/constants/search/search";
import { createClient } from "@/lib/supabase/client";
import type { ChatSearchResult, ChatSearchSection } from "@/types/search/search";
import { useInfiniteQuery } from "@tanstack/react-query";

function isChatSearchSection(section: string): section is ChatSearchSection {
  return section === "title" || section === "owner";
}

function isChatSearchResult(result: { section: string }): result is ChatSearchResult {
  return isChatSearchSection(result.section);
}

function flattenPages(pages?: ChatSearchResult[][]) {
  return pages?.flat() ?? [];
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

function useChatRoomSearchSection(query: string, section: ChatSearchSection) {
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

export function useChatRoomSearchResults(query: string) {
  const trimmedQuery = query.trim();
  const titleSearch = useChatRoomSearchSection(trimmedQuery, "title");
  const ownerSearch = useChatRoomSearchSection(trimmedQuery, "owner");
  const titleResults = flattenPages(titleSearch.data?.pages);
  const ownerResults = flattenPages(ownerSearch.data?.pages);

  return {
    trimmedQuery,
    isEmptyQuery: trimmedQuery.length === 0,
    isError: titleSearch.isError || ownerSearch.isError,
    isLoading: titleSearch.isLoading || ownerSearch.isLoading,
    isEmptyResult: titleResults.length === 0 && ownerResults.length === 0,
    title: {
      results: titleResults,
      hasMore: titleSearch.hasNextPage,
      isFetchingMore: titleSearch.isFetchingNextPage,
      fetchMore: titleSearch.fetchNextPage,
    },
    owner: {
      results: ownerResults,
      hasMore: ownerSearch.hasNextPage,
      isFetchingMore: ownerSearch.isFetchingNextPage,
      fetchMore: ownerSearch.fetchNextPage,
    },
  };
}
