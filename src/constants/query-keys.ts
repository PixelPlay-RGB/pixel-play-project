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
  },
} as const;
