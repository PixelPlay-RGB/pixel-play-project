// query-keys 상수를 정의합니다.
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
    profiles: () => [...QUERY_KEYS.auth.all, "profile"],
    profile: (userId?: string) => [...QUERY_KEYS.auth.all, "profile", userId ?? "session"],
  },
  chat: {
    all: ["chat"] as const,
    list: (
      userId?: string,
      tabType?: string,
      sortOption?: string,
      page?: number,
      searchQuery?: string,
      limit?: number,
    ) =>
      [
        ...QUERY_KEYS.chat.all,
        "list",
        userId,
        tabType,
        sortOption,
        page,
        searchQuery,
        limit,
      ].filter((v) => v !== undefined),
    detail: (roomId?: string, userId?: string) =>
      [...QUERY_KEYS.chat.all, "detail", roomId, userId].filter((v) => v !== undefined),
    messages: (roomId?: string) =>
      [...QUERY_KEYS.chat.all, "messages", roomId].filter((v) => v !== undefined),
    search: (query?: string, section?: string) =>
      [...QUERY_KEYS.chat.all, "search", query, section].filter((v) => v !== undefined),
  },
  live: {
    all: ["live"] as const,
    listAll: () => [...QUERY_KEYS.live.all, "list"],
    list: (
      userId?: string,
      filter?: string,
      sort?: string,
      visibleCount?: number,
      excludedLiveId?: string | null,
    ) =>
      [
        ...QUERY_KEYS.live.listAll(),
        userId ?? "public",
        filter,
        sort,
        visibleCount,
        excludedLiveId ?? undefined,
      ].filter((v) => v !== undefined),
    sidebar: {
      trending: (userId?: string) => [
        ...QUERY_KEYS.live.all,
        "sidebar",
        "trending",
        userId ?? "public",
      ],
      following: (userId?: string) => [
        ...QUERY_KEYS.live.all,
        "sidebar",
        "following",
        userId ?? "public",
      ],
      keywords: () => [...QUERY_KEYS.live.all, "sidebar", "keywords"],
    },
    searchAll: () => [...QUERY_KEYS.live.all, "search"],
    search: (query?: string, section?: string) =>
      [...QUERY_KEYS.live.searchAll(), query, section].filter((v) => v !== undefined),
  },
  following: {
    all: ["following"] as const,
    pageAll: () => [...QUERY_KEYS.following.all, "page"],
    page: (userId?: string, filter?: string, page?: number) =>
      [...QUERY_KEYS.following.pageAll(), userId ?? "public", filter, page].filter(
        (v) => v !== undefined,
      ),
  },
} as const;
