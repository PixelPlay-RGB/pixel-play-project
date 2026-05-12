/**
 * Centralized Query Key Factory
 */
export const QUERY_KEYS = {
  auth: {
    all: ["auth"] as const,
    session: () => [...QUERY_KEYS.auth.all, "session"],
    profile: (userId?: string) => [...QUERY_KEYS.auth.all, "profile", userId ?? "session"],
  },
  chat: {
    all: ["chat"] as const,
    rooms: (userId?: string, tabType?: string) =>
      [...QUERY_KEYS.chat.all, "rooms", userId, tabType].filter(Boolean),
    counts: (userId?: string) => [...QUERY_KEYS.chat.all, "counts", userId].filter(Boolean),
    room: (roomId?: string) => [...QUERY_KEYS.chat.all, "room", roomId].filter(Boolean),
    messages: (roomId?: string) => [...QUERY_KEYS.chat.all, "messages", roomId].filter(Boolean),
    members: (roomId?: string) => [...QUERY_KEYS.chat.all, "members", roomId].filter(Boolean),
    entryStatus: (roomId?: string, userId?: string) =>
      [...QUERY_KEYS.chat.all, "entryStatus", roomId, userId].filter(Boolean),
    search: (query?: string, section?: string) =>
      [...QUERY_KEYS.chat.all, "search", query, section].filter(Boolean),
  },
} as const;
