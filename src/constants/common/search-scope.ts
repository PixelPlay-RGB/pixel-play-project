// 헤더 검색 범위별 설정(라벨, 아이콘, 검색 경로, placeholder)을 정의합니다.

import type { SearchScope } from "@/stores/search-scope";
import type { LucideIcon } from "lucide-react";
import { Radio } from "lucide-react";

export interface SearchScopeConfig {
  value: SearchScope;
  label: string;
  icon: LucideIcon;
  path: "/live/search";
  placeholder: string;
}

export const SEARCH_SCOPES: SearchScopeConfig[] = [
  {
    value: "live",
    label: "라이브",
    icon: Radio,
    path: "/live/search",
    placeholder: "방송 제목·크리에이터 검색",
  },
];

export function getSearchScopeConfig(scope: SearchScope): SearchScopeConfig {
  return SEARCH_SCOPES.find((config) => config.value === scope) ?? SEARCH_SCOPES[0];
}
