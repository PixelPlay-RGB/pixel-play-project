// 헤더 검색 범위(라이브/채팅)를 관리합니다. 라우터가 아니라 사용자가 직접 선택합니다.

import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type SearchScope = "live" | "chat";

interface SearchScopeState {
  scope: SearchScope;
  setScope: (scope: SearchScope) => void;
}

export const useSearchScopeStore = create<SearchScopeState>()(
  devtools(
    (set) => ({
      scope: "live",
      setScope: (scope) => set({ scope }, false, "searchScope/setScope"),
    }),
    {
      name: "SearchScopeStore",
      enabled: process.env.NODE_ENV !== "production",
    },
  ),
);
