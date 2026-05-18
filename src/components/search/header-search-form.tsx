"use client";
// Header에서 검색어를 입력받아 검색 페이지로 이동합니다.
import SearchInput from "@/components/search/search-input";
import { Button } from "@/components/ui/button";
import {
  mobileHeaderSearchTransition,
  mobileHeaderSearchVariants,
} from "@/lib/framer-motion/header-search";
import { cn } from "@/lib/utils";
import { useMainMenuStore } from "@/stores/main-menu";
import type { MainMenuSidebarKey } from "@/types/main-menu-sidebar";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Search } from "lucide-react";
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
  const isMobileSearchOpen = mobileOpen && !isLiveSearchDisabled;

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
      <div className="sm:hidden">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => !isLiveSearchDisabled && setMobileOpen(true)}
          disabled={isLiveSearchDisabled}
          aria-label="채팅방 전체 검색"
          className={cn(
            "text-muted-foreground hover:text-foreground",
            isLiveSearchDisabled && "cursor-not-allowed",
          )}
        >
          <Search className="size-5" />
        </Button>
        <AnimatePresence>
          {isMobileSearchOpen && (
            <motion.div
              key="mobile-header-search"
              initial="closed"
              animate="open"
              exit="closed"
              variants={mobileHeaderSearchVariants}
              transition={mobileHeaderSearchTransition}
              className={cn(
                "border-brand/15 bg-background dark:border-border",
                "fixed inset-x-0 top-0 z-[60] flex h-14 items-center gap-2 border-b px-3 shadow-sm",
              )}
            >
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleClose}
                aria-label="검색 닫기"
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <ArrowLeft className="size-5" />
              </Button>
              <SearchInput
                value={query}
                onChange={setQuery}
                onSubmit={handleSearch}
                placeholder="채팅방 전체 검색"
                disabled={isLiveSearchDisabled}
                autoFocus
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    handleClose();
                  }
                }}
                className="min-w-0 flex-1"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SearchInput
        value={query}
        onChange={setQuery}
        onSubmit={handleSearch}
        placeholder={isLiveSearchDisabled ? "라이브 검색 준비 중" : "채팅방 전체 검색"}
        disabled={isLiveSearchDisabled}
        className="hidden sm:block sm:w-48 md:w-64"
      />
    </>
  );
}
