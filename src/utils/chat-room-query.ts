// 채팅방 변경 작업 후 React Query 캐시를 정리하는 유틸리티

import type { QueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/query-keys";

export function invalidateChatRoomMutationQueries(queryClient: QueryClient, roomId: string) {
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.detail(roomId) });
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.list() });
}

export function removeChatRoomDetailQueries(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: QUERY_KEYS.chat.detail() });
  queryClient.removeQueries({ queryKey: QUERY_KEYS.chat.messages() });
}
