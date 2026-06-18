// 라이브 검색 팔로잉 토글에서 사용하는 타입을 정의합니다.

import type { InfiniteData } from "@tanstack/react-query";

import type { LiveSearchResult } from "@/types/search/search";

export type LiveSearchInfiniteData = InfiniteData<LiveSearchResult[]>;
