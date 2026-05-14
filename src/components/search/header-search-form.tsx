"use client";

// Header에서 검색어를 입력받아 검색 페이지로 이동합니다.
import SearchInput from "@/components/search/search-input";
import { cn } from "@/lib/utils";
import { useMainMenuStore } from "@/stores/main-menu";
import type { MainMenuSidebarKey } from "@/types/main-menu-sidebar";
import { Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

function resolveSearchPath(activeMenu: MainMenuSidebarKey, query: string) {
  const searchParams = new URLSearchParams({ query });

  if (activeMenu === "live") {
    return `/search/live?${searchParams.toString()}`;
  }

  return `/search/chat?${searchParams.toString()}`;
}

export default function HeaderSearchForm() {
  const router = useRouter();
  const pathname = usePathname();
  const activeMenu = useMainMenuStore((state) => state.activeMenu);
  const [query, setQuery] = useState("");
  const isLiveSearchDisabled = activeMenu === "live";
  const isOnSearchPage = pathname.startsWith("/search/");

  const handleSearch = () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || isLiveSearchDisabled) return;
    router.push(resolveSearchPath(activeMenu, trimmedQuery));
    setQuery("");
  };

  return (
    <>
      {/* 모바일 전용 아이콘 버튼 — 검색 페이지가 아닐 때만 표시 */}
      {!isOnSearchPage && (
        <button
          className="text-muted-foreground hover:text-foreground p-1 transition-colors sm:hidden"
          onClick={() => !isLiveSearchDisabled && router.push("/search/chat")}
          disabled={isLiveSearchDisabled}
          aria-label="채팅방 검색"
        >
          <Search className="size-5" />
        </button>
      )}

      {/* 검색 입력창 — sm 이상 항상, 모바일은 검색 페이지에서만 표시 */}
      <SearchInput
        value={query}
        onChange={setQuery}
        onSubmit={handleSearch}
        placeholder={isLiveSearchDisabled ? "라이브 검색 준비 중" : "채팅방 검색"}
        disabled={isLiveSearchDisabled}
        className={cn(
          "sm:block sm:w-48 md:w-64",
          isOnSearchPage ? "block w-40" : "hidden",
        )}
      />
    </>
  );
}
