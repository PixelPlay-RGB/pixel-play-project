"use client";

// Header에서 검색어를 입력받아 검색 페이지로 이동합니다.
import SearchInput from "@/components/search/search-input";
import { useMainMenuStore } from "@/stores/main-menu";
import type { MainMenuSidebarKey } from "@/types/main-menu-sidebar";
import { useRouter } from "next/navigation";
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
  const activeMenu = useMainMenuStore((state) => state.activeMenu);
  const [query, setQuery] = useState("");
  const isLiveSearchDisabled = activeMenu === "live";

  const handleSearch = () => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery || isLiveSearchDisabled) {
      return;
    }

    router.push(resolveSearchPath(activeMenu, trimmedQuery));
    setQuery("");
  };

  return (
    <SearchInput
      value={query}
      onChange={setQuery}
      onSubmit={handleSearch}
      placeholder={isLiveSearchDisabled ? "라이브 검색 준비 중" : "채팅방 검색"}
      disabled={isLiveSearchDisabled}
      className="order-3 mt-2 w-full basis-full sm:order-0 sm:mt-0 sm:w-48 sm:basis-auto md:w-64"
    />
  );
}
