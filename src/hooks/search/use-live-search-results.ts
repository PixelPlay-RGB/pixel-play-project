"use client";
// 라이브 검색 결과 페이지에 필요한 섹션별 검색 상태를 제공합니다.
import { QUERY_KEYS } from "@/constants/common/query-keys";
import {
  LIVE_BROADCAST_SEARCH_RESULT_LIMIT,
  LIVE_CREATOR_SEARCH_RESULT_LIMIT,
} from "@/constants/search/search";
import { createClient } from "@/lib/supabase/client";
import type { LiveSearchResult, LiveSearchRpcRow, LiveSearchSection } from "@/types/search/search";
import { normalizeLiveSearchQuery } from "@/utils/search/live-search";
import { useInfiniteQuery } from "@tanstack/react-query";

function isLiveSearchSection(section: string): section is LiveSearchSection {
  return section === "broadcast" || section === "creator";
}

function toLiveSearchResult(result: LiveSearchRpcRow): LiveSearchResult | null {
  if (!isLiveSearchSection(result.section)) {
    return null;
  }

  return {
    ...result,
    broadcast_id: result.broadcast_id ?? null,
    section: result.section,
    started_at: result.started_at ?? null,
    thumbnail_url: result.thumbnail_url ?? null,
    title: result.title ?? null,
  };
}

function flattenPages(pages?: LiveSearchResult[][]) {
  return pages?.flat() ?? [];
}

function getLiveSearchLimit(section: LiveSearchSection) {
  return section === "broadcast"
    ? LIVE_BROADCAST_SEARCH_RESULT_LIMIT
    : LIVE_CREATOR_SEARCH_RESULT_LIMIT;
}

async function fetchLiveSearchResults(
  query: string,
  section: LiveSearchSection,
  offset: number,
): Promise<LiveSearchResult[]> {
  const supabase = createClient();
  const limit = getLiveSearchLimit(section);

  const { data, error } = await supabase.rpc("search_live_results", {
    p_query: query,
    p_limit: limit,
    p_section: section,
    p_offset: offset,
  });

  if (error) {
    throw error;
  }

  return (data ?? []).flatMap((result) => {
    const liveSearchResult = toLiveSearchResult(result);
    return liveSearchResult ? [liveSearchResult] : [];
  });
}

function useLiveSearchSection(query: string, section: LiveSearchSection) {
  const trimmedQuery = normalizeLiveSearchQuery(query);
  const limit = getLiveSearchLimit(section);

  return useInfiniteQuery<LiveSearchResult[]>({
    queryKey: QUERY_KEYS.live.search(trimmedQuery, section),
    queryFn: ({ pageParam }) => fetchLiveSearchResults(trimmedQuery, section, Number(pageParam)),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.at(-1)?.has_more ? allPages.length * limit : undefined,
    enabled: trimmedQuery.length > 0,
  });
}

export function useLiveSearchResults(query: string) {
  const trimmedQuery = normalizeLiveSearchQuery(query);
  const broadcastSearch = useLiveSearchSection(trimmedQuery, "broadcast");
  const creatorSearch = useLiveSearchSection(trimmedQuery, "creator");
  const broadcastResults = flattenPages(broadcastSearch.data?.pages);
  const creatorResults = flattenPages(creatorSearch.data?.pages);

  return {
    trimmedQuery,
    isEmptyQuery: trimmedQuery.length === 0,
    isError: broadcastSearch.isError || creatorSearch.isError,
    isLoading: broadcastSearch.isLoading || creatorSearch.isLoading,
    isEmptyResult: broadcastResults.length === 0 && creatorResults.length === 0,
    broadcast: {
      results: broadcastResults,
      hasMore: broadcastSearch.hasNextPage,
      isFetchingMore: broadcastSearch.isFetchingNextPage,
      fetchMore: broadcastSearch.fetchNextPage,
    },
    creator: {
      results: creatorResults,
      hasMore: creatorSearch.hasNextPage,
      isFetchingMore: creatorSearch.isFetchingNextPage,
      fetchMore: creatorSearch.fetchNextPage,
    },
  };
}
