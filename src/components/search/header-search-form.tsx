"use client";

// Header에서 검색어를 입력받아 검색 페이지로 이동합니다.
import SearchInput from "@/components/search/search-input";
import { cn } from "@/lib/utils";
import { useMainMenuStore } from "@/stores/main-menu";
import type { MainMenuSidebarKey } from "@/types/main-menu-sidebar";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

function resolveSearchPath(activeMenu: MainMenuSidebarKey, query: string) {
  const searchParams = new URLSearchParams({ query });
  if (activeMenu === "live") return `/search/live?${searchParams.toString()}`;
  return `/search/chat?${searchParams.toString()}`;
}

export default function HeaderSearchForm() {
  const router = useRouter();
  const activeMenu = useMainMenuStore((state) => state.activeMenu);
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLiveSearchDisabled = activeMenu === "live";

  const handleSearch = () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || isLiveSearchDisabled) return;
    router.push(resolveSearchPath(activeMenu, trimmedQuery));
    setQuery("");
    setMobileOpen(false);
  };

  const handleClose = () => {
    setMobileOpen(false);
    setQuery("");
  };

  return (
    <>
      {/* 모바일: 아이콘 토글 → 검색창 인라인 표시 */}
      <div className="sm:hidden">
        {mobileOpen ? (
          <div className="flex items-center gap-1">
            <SearchInput
              value={query}
              onChange={setQuery}
              onSubmit={handleSearch}
              placeholder="채팅방 검색"
              disabled={isLiveSearchDisabled}
              className="w-44"
            />
            <button
              className="text-muted-foreground hover:text-foreground p-1 transition-colors"
              onClick={handleClose}
              aria-label="검색 닫기"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <button
            className={cn(
              "text-muted-foreground hover:text-foreground p-1 transition-colors",
              isLiveSearchDisabled && "cursor-not-allowed opacity-50",
            )}
            onClick={() => !isLiveSearchDisabled && setMobileOpen(true)}
            disabled={isLiveSearchDisabled}
            aria-label="채팅방 검색"
          >
            <Search className="size-5" />
          </button>
        )}
      </div>

      {/* sm 이상: 항상 검색 인풋 */}
      <SearchInput
        value={query}
        onChange={setQuery}
        onSubmit={handleSearch}
        placeholder={isLiveSearchDisabled ? "라이브 검색 준비 중" : "채팅방 검색"}
        disabled={isLiveSearchDisabled}
        className="hidden sm:block sm:w-48 md:w-64"
      />
    </>
  );
}
