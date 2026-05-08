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
    /**
     * 탭별 채팅방 목록 키.
     * - tabType이 달라지면 별도 캐시로 관리된다.
     * - 전체 목록을 한 번에 패칭하고 클라이언트에서 무한스크롤로 보여주므로 page는 키에 포함하지 않는다.
     */
    rooms: (userId?: string, tabType?: string) =>
      [...QUERY_KEYS.chat.all, "rooms", userId, tabType].filter((v) => v !== undefined),
    counts: (userId?: string) => [...QUERY_KEYS.chat.all, "counts", userId].filter((v) => v !== undefined),
    room: (roomId?: string) => [...QUERY_KEYS.chat.all, "room", roomId].filter(Boolean),
    messages: (roomId?: string) => [...QUERY_KEYS.chat.all, "messages", roomId].filter(Boolean),
    members: (roomId?: string) => [...QUERY_KEYS.chat.all, "members", roomId].filter(Boolean),
  },
} as const;
