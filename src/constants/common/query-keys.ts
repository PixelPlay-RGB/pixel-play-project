// query-keys 상수를 정의합니다.
import type { CommunityCommentSort } from "@/types/community/community";
/**
 * Centralized Query Key Factory
 *
 * 규칙:
 * - 계층 구조: [도메인, 리소스, ...식별자] 순서로 구성한다.
 * - undefined 필터링: filter(Boolean) 대신 filter((v) => v !== undefined)를 사용한다.
 *   filter(Boolean)은 숫자 0을 제거하므로, page처럼 0이 될 수 있는 파라미터가 포함될 경우 오탈락 위험이 있다.
 * - 상위 키 무효화: queryClient.invalidateQueries({ queryKey: QUERY_KEYS.community.all })처럼
 *   상위 키를 지정하면 하위 쿼리를 일괄 무효화할 수 있다.
 */
export const QUERY_KEYS = {
  auth: {
    all: ["auth"] as const,
    session: () => [...QUERY_KEYS.auth.all, "session"],
    profileAll: () => [...QUERY_KEYS.auth.all, "profile"],
    profile: (userId?: string) => [...QUERY_KEYS.auth.all, "profile", userId ?? "session"],
  },
  live: {
    all: ["live"] as const,
    // 라이브 시청 (watch/chat/poll)
    watch: (creatorId?: string, userId?: string) =>
      [...QUERY_KEYS.live.all, "watch", creatorId, userId].filter((v) => v !== undefined),
    messages: (broadcastId?: string) =>
      [...QUERY_KEYS.live.all, "messages", broadcastId].filter((v) => v !== undefined),
    // 시청자 본인의 채팅 역할 스냅샷(후원 성공 시 donor로 즉시 승격) — 낙관적 메시지 뱃지용
    viewerRole: (creatorId?: string) =>
      [...QUERY_KEYS.live.all, "viewer-role", creatorId].filter((v) => v !== undefined),
    polls: (broadcastId?: string) =>
      [...QUERY_KEYS.live.all, "polls", broadcastId].filter((v) => v !== undefined),
    pollsForViewer: (broadcastId?: string, userId?: string | null) =>
      [...QUERY_KEYS.live.polls(broadcastId), userId ?? "public"].filter((v) => v !== undefined),
    viewerProfile: (creatorId?: string, targetUserId?: string) =>
      [...QUERY_KEYS.live.all, "viewer-profile", creatorId, targetUserId].filter(
        (v) => v !== undefined,
      ),
    // 닉네임 팝업의 팔로우 버튼 — "현재 시청자가 대상 채널을 팔로우 중인지".
    viewerFollowStatus: (viewerId?: string, targetUserId?: string) =>
      [...QUERY_KEYS.live.all, "viewer-follow-status", viewerId, targetUserId].filter(
        (v) => v !== undefined,
      ),
    interactionNotices: (broadcastId?: string, userId?: string | null) =>
      [...QUERY_KEYS.live.all, "interaction-notices", broadcastId, userId ?? "public"].filter(
        (v) => v !== undefined,
      ),
    // 라이브 목록
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
    sidebarAll: () => [...QUERY_KEYS.live.all, "sidebar"],
    sidebar: {
      trending: (userId?: string) => [
        ...QUERY_KEYS.live.sidebarAll(),
        "trending",
        userId ?? "public",
      ],
      following: (userId?: string) => [
        ...QUERY_KEYS.live.sidebarAll(),
        "following",
        userId ?? "public",
      ],
      keywords: () => [...QUERY_KEYS.live.sidebarAll(), "keywords"],
    },
    searchAll: () => [...QUERY_KEYS.live.all, "search"],
    search: (query?: string, section?: string) =>
      [...QUERY_KEYS.live.searchAll(), query, section].filter((v) => v !== undefined),
  },
  clip: {
    all: ["clip"] as const,
    channelAll: (creatorId?: string) =>
      [...QUERY_KEYS.clip.all, "channel", creatorId].filter((v) => v !== undefined),
    channel: (creatorId?: string, sort?: string, period?: string, limit?: number) =>
      [...QUERY_KEYS.clip.channelAll(creatorId), sort, period, limit].filter(
        (v) => v !== undefined,
      ),
  },
  donations: {
    all: ["donations"] as const,
    walletBalance: (userId?: string) =>
      [...QUERY_KEYS.donations.all, "wallet-balance", userId].filter((v) => v !== undefined),
    liveRanking: (creatorId?: string) =>
      [...QUERY_KEYS.donations.all, "live-ranking", creatorId].filter((v) => v !== undefined),
  },
  following: {
    all: ["following"] as const,
    pageAll: () => [...QUERY_KEYS.following.all, "page"],
    page: (userId?: string, filter?: string, page?: number) =>
      [...QUERY_KEYS.following.pageAll(), userId ?? "public", filter, page].filter(
        (v) => v !== undefined,
      ),
  },
  community: {
    all: ["community"] as const,
    postsAll: () => [...QUERY_KEYS.community.all, "posts"],
    posts: (creatorId?: string, page?: number) =>
      [...QUERY_KEYS.community.postsAll(), creatorId, page].filter((v) => v !== undefined),
    post: (postId?: string) =>
      [...QUERY_KEYS.community.all, "post", postId].filter((v) => v !== undefined),
    commentsAll: () => [...QUERY_KEYS.community.all, "comments"],
    comments: (postId?: string, sort?: CommunityCommentSort, page?: number) =>
      [...QUERY_KEYS.community.commentsAll(), postId, sort, page].filter((v) => v !== undefined),
    commentRepliesAll: () => [...QUERY_KEYS.community.all, "commentReplies"],
    commentReplies: (commentId?: string) =>
      [...QUERY_KEYS.community.commentRepliesAll(), commentId].filter((v) => v !== undefined),
  },
  settlement: {
    all: ["settlement"] as const,
    donationsAll: () => [...QUERY_KEYS.settlement.all, "donations"],
    donations: (year?: number, status?: string, sort?: string, page?: number) =>
      [...QUERY_KEYS.settlement.donationsAll(), year, status, sort, page].filter(
        (v) => v !== undefined,
      ),
  },
  channel: {
    all: ["channel"] as const,
    analyticsFollowFeed: (creatorId?: string) =>
      [...QUERY_KEYS.channel.all, "analytics", "follow-feed", creatorId].filter(
        (v) => v !== undefined,
      ),
    managersAll: () => [...QUERY_KEYS.channel.all, "managers"],
    managers: (creatorId?: string) =>
      [...QUERY_KEYS.channel.managersAll(), creatorId].filter((v) => v !== undefined),
    viewerBansAll: () => [...QUERY_KEYS.channel.all, "viewer-bans"],
    viewerBans: (creatorId?: string, page?: number) =>
      [...QUERY_KEYS.channel.viewerBansAll(), creatorId, page].filter((v) => v !== undefined),
  },
  notification: {
    all: ["notification"] as const,
    listAll: () => [...QUERY_KEYS.notification.all, "list"],
    list: (userId?: string) =>
      [...QUERY_KEYS.notification.listAll(), userId ?? "public"].filter((v) => v !== undefined),
    lastSeen: (userId?: string) =>
      [...QUERY_KEYS.notification.all, "last-seen", userId ?? "public"].filter(
        (v) => v !== undefined,
      ),
    unreadCountAll: (userId?: string) =>
      [...QUERY_KEYS.notification.all, "unread", userId ?? "public"].filter((v) => v !== undefined),
    unreadCount: (userId?: string, lastSeen?: string | null) =>
      [...QUERY_KEYS.notification.unreadCountAll(userId), lastSeen].filter((v) => v !== undefined),
  },
} as const;
