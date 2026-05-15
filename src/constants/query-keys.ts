/**
 * Centralized Query Key Factory
 *
 * 규칙:
 * - 계층 구조: [도메인, 리소스, ...식별자] 순서로 구성한다.
 * - undefined 필터링: filter(Boolean) 대신 filter((v) => v !== undefined)를 사용한다.
 *   filter(Boolean)은 숫자 0을 제거하므로, page처럼 0이 될 수 있는 파라미터가 포함될 경우 오탈락 위험이 있다.
 * - 상위 키 무효화: queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chat.all })처럼
 *   상위 키를 지정하면 하위 쿼리를 일괄 무효화할 수 있다.
 */
export const QUERY_KEYS = {
  auth: {
    all: ["auth"] as const,
    session: () => [...QUERY_KEYS.auth.all, "session"],
    profile: (userId?: string) => [...QUERY_KEYS.auth.all, "profile", userId ?? "session"],
  },
  chat: {
    all: ["chat"] as const,
    rooms: (userId?: string, tabType?: string, sortOption?: string, page?: number) =>
      [...QUERY_KEYS.chat.all, "rooms", userId, tabType, sortOption, page].filter(Boolean),
    counts: (userId?: string) => [...QUERY_KEYS.chat.all, "counts", userId].filter(Boolean),
    room: (roomId?: string) => [...QUERY_KEYS.chat.all, "room", roomId].filter(Boolean),
    messages: (roomId?: string) => [...QUERY_KEYS.chat.all, "messages", roomId].filter(Boolean),
    members: (roomId?: string) => [...QUERY_KEYS.chat.all, "members", roomId].filter(Boolean),
    search: (query?: string, section?: string) =>
      [...QUERY_KEYS.chat.all, "search", query, section].filter(Boolean),
  },
} as const;
