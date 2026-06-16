// 채널 구독자 관리 목록의 활성 카운트와 검색·정렬 값을 계산합니다.

export type ChannelSubscriptionStatus = "active" | "expired" | "canceled";

export type ChannelSubscriberSort =
  | "started_desc"
  | "started_asc"
  | "months_desc"
  | "months_asc"
  | "nickname_asc";

export interface ChannelSubscriberItem {
  id: string;
  subscriberId: string;
  nickname: string;
  startedAt: string;
  endAt: string;
  totalMonths: number;
  status: ChannelSubscriptionStatus;
}

export interface ChannelSubscriptionSnapshot {
  creatorId: string;
  activeCount: number;
  subscribers: ChannelSubscriberItem[];
  customBadgeMonths: number[];
  subscriptionBadgeVersion: string | null;
  subscriptionBadgeImageSources: Record<number, string>;
}

interface FilterAndSortOptions {
  query: string;
  sort: ChannelSubscriberSort;
}

function compareStartedAtDesc(a: ChannelSubscriberItem, b: ChannelSubscriberItem) {
  return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
}

function compareNicknameAsc(a: ChannelSubscriberItem, b: ChannelSubscriberItem) {
  return a.nickname.localeCompare(b.nickname, "ko-KR");
}

export function getActiveChannelSubscriberCount(
  subscribers: readonly ChannelSubscriberItem[],
  now: Date = new Date(),
) {
  const nowTime = now.getTime();

  return subscribers.filter(
    (subscriber) =>
      subscriber.status === "active" && new Date(subscriber.endAt).getTime() > nowTime,
  ).length;
}

export function filterAndSortChannelSubscribers(
  subscribers: readonly ChannelSubscriberItem[],
  { query, sort }: FilterAndSortOptions,
) {
  const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");
  const filtered = normalizedQuery
    ? subscribers.filter((subscriber) =>
        subscriber.nickname.toLocaleLowerCase("ko-KR").includes(normalizedQuery),
      )
    : [...subscribers];

  return filtered.sort((a, b) => {
    if (sort === "started_asc") {
      return -compareStartedAtDesc(a, b) || compareNicknameAsc(a, b);
    }

    if (sort === "months_desc") {
      return b.totalMonths - a.totalMonths || compareStartedAtDesc(a, b);
    }

    if (sort === "months_asc") {
      return a.totalMonths - b.totalMonths || compareStartedAtDesc(a, b);
    }

    if (sort === "nickname_asc") {
      return compareNicknameAsc(a, b) || compareStartedAtDesc(a, b);
    }

    return compareStartedAtDesc(a, b) || compareNicknameAsc(a, b);
  });
}

export function buildChannelSubscriptionSnapshot(
  subscribers: readonly ChannelSubscriberItem[],
  now: Date = new Date(),
  options: {
    creatorId?: string;
    customBadgeMonths?: readonly number[];
    subscriptionBadgeVersion?: string | null;
    subscriptionBadgeImageSources?: Record<number, string>;
  } = {},
): ChannelSubscriptionSnapshot {
  return {
    creatorId: options.creatorId ?? "",
    activeCount: getActiveChannelSubscriberCount(subscribers, now),
    subscribers: filterAndSortChannelSubscribers(subscribers, {
      query: "",
      sort: "started_desc",
    }),
    customBadgeMonths: [...(options.customBadgeMonths ?? [])],
    subscriptionBadgeVersion: options.subscriptionBadgeVersion ?? null,
    subscriptionBadgeImageSources: { ...(options.subscriptionBadgeImageSources ?? {}) },
  };
}
