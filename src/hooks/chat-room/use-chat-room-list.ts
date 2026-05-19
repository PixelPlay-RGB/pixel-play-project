"use client";
// 홈 채팅방 목록의 방 목록과 탭 count를 함께 조회하는 훅

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/common/query-keys";
import { useUser } from "@/hooks/profile/use-profile";
import { createClient } from "@/lib/supabase/client";
import type {
  ChatRoomCounts,
  ChatRoomListItem,
  ChatRoomListResponse,
  ChatRoomSortOption,
  ChatRoomTab,
} from "@/types/chat-room/chat-room";
import {
  getEffectiveChatRoomCounts,
  parseChatRoomListItems,
} from "@/utils/chat-room/chat-room-list";

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
  pageSize: number | null,
) {
  const { data: currentUser, isFetched: isUserFetched } = useUser();
  const limit = pageSize;
  const offset = limit === null ? 0 : (currentPage - 1) * limit;
  const trimmedQuery = searchQuery.trim();
  const queryParam = trimmedQuery || undefined;

  const query = useQuery<ChatRoomListResult>({
    queryKey: QUERY_KEYS.chat.list(
      currentUser?.id,
      tabType,
      sortOption,
      currentPage,
      queryParam,
      limit ?? undefined,
    ),
    queryFn: () => {
      if (limit === null) {
        throw new Error("채팅방 목록 page size가 아직 확정되지 않았습니다.");
      }

      return fetchChatRoomList({
        tabType,
        sortOption,
        limit,
        offset,
        searchQuery: trimmedQuery,
      });
    },
    enabled: !!currentUser?.id && isUserFetched && limit !== null,
    placeholderData: keepPreviousData,
    refetchOnMount: "always",
  });

  return {
    ...query,
    pageSize,
  };
}
