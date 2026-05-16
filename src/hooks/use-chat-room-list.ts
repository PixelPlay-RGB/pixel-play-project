"use client";

// 홈 채팅방 목록의 방 목록과 탭 count를 함께 조회하는 훅

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { CHAT_ROOM_MOBILE_PAGE_SIZE, CHAT_ROOM_PAGE_SIZE } from "@/constants/chat-room";
import { QUERY_KEYS } from "@/constants/query-keys";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUser } from "@/hooks/use-profile";
import { createClient } from "@/lib/supabase/client";
import type {
  ChatRoomCounts,
  ChatRoomListItem,
  ChatRoomListResponse,
  ChatRoomSortOption,
  ChatRoomTab,
} from "@/types/chat-room";
import { getEffectiveChatRoomCounts, parseChatRoomListItems } from "@/utils/chat-room-list";

interface ChatRoomListResult {
  rooms: ChatRoomListItem[];
  counts: ChatRoomCounts;
  totalItems: number;
  totalPages: number;
}

function getBaseCounts(response: ChatRoomListResponse): ChatRoomCounts {
  return {
    JOINED: response.joined_count,
    NOT_JOINED: response.not_joined_count,
    OWNED: response.owned_count,
  };
}

async function fetchChatRoomList({
  tabType,
  sortOption,
  limit,
  offset,
  searchQuery,
}: {
  tabType: ChatRoomTab;
  sortOption: ChatRoomSortOption;
  limit: number;
  offset: number;
  searchQuery: string;
}): Promise<ChatRoomListResult> {
  const supabase = createClient();
  const queryParam = searchQuery.trim() || undefined;

  const { data, error } = await supabase
    .rpc("get_chat_room_list", {
      p_tab_type: tabType,
      p_limit: limit,
      p_offset: offset,
      p_sort_option: sortOption,
      p_query: queryParam,
    })
    .single();

  if (error) {
    throw error;
  }

  const baseCounts = getBaseCounts(data);
  const totalItems = data.total_count;

  return {
    rooms: parseChatRoomListItems(data.rooms),
    counts: getEffectiveChatRoomCounts(baseCounts, tabType, totalItems, searchQuery),
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
  };
}

export function useChatRoomList(
  tabType: ChatRoomTab,
  sortOption: ChatRoomSortOption,
  currentPage: number,
  searchQuery: string,
) {
  const { data: currentUser, isFetched: isUserFetched } = useUser();
  const isMobile = useIsMobile();
  const limit = isMobile ? CHAT_ROOM_MOBILE_PAGE_SIZE : CHAT_ROOM_PAGE_SIZE;
  const offset = (currentPage - 1) * limit;
  const trimmedQuery = searchQuery.trim();
  const queryParam = trimmedQuery || undefined;

  return useQuery<ChatRoomListResult>({
    queryKey: QUERY_KEYS.chat.list(
      currentUser?.id,
      tabType,
      sortOption,
      currentPage,
      queryParam,
      limit,
    ),
    queryFn: () =>
      fetchChatRoomList({
        tabType,
        sortOption,
        limit,
        offset,
        searchQuery: trimmedQuery,
      }),
    enabled: !!currentUser?.id && isUserFetched,
    placeholderData: keepPreviousData,
    refetchOnMount: "always",
  });
}
