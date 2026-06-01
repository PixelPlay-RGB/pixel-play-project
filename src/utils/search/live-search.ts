// 라이브 검색 query와 태그 표시 값을 정리합니다.

export function normalizeLiveSearchQuery(query: string) {
  return query.trim().replace(/^#+/, "").trim();
}

export function createLiveSearchHref(query: string) {
  const normalizedQuery = normalizeLiveSearchQuery(query);
  const searchParams = new URLSearchParams({ query: normalizedQuery });

  return `/live/search?${searchParams.toString()}`;
}

export function getLiveSearchTagLabels(tags: string[], limit = 3) {
  return tags
    .map((tag) => tag.trim())
    .filter((tag) => tag !== "")
    .slice(0, limit);
}
