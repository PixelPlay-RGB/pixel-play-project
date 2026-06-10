"use client";
// Header에서 검색어를 입력해 라이브 검색 페이지로 이동합니다. 어떤 화면에서도 항상 노출됩니다.
import SearchInput from "@/components/search/search-input";
import { Button } from "@/components/ui/button";
import {
  mobileHeaderSearchTransition,
  mobileHeaderSearchVariants,
} from "@/lib/framer-motion/header-search";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const LIVE_SEARCH_PATH = "/live/search";
const SEARCH_PLACEHOLDER = "방송 제목·크리에이터 검색";

export default function HeaderSearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    const searchParams = new URLSearchParams({ query: trimmedQuery });
    router.push(`${LIVE_SEARCH_PATH}?${searchParams.toString()}`);
    setQuery("");
    setMobileOpen(false);
  };

  const handleClose = () => {
    setMobileOpen(false);
    setQuery("");
  };

  return (
    <>
      {/* 모바일: 검색 아이콘 → 전체폭 오버레이 */}
      <div className="sm:hidden">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setMobileOpen(true)}
          aria-label="검색 열기"
          className="text-muted-foreground hover:text-foreground"
        >
          <Search className="size-5" />
        </Button>
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="mobile-header-search"
              initial="closed"
              animate="open"
              exit="closed"
              variants={mobileHeaderSearchVariants}
              transition={mobileHeaderSearchTransition}
              className={cn(
                "border-brand/15 bg-background dark:border-border",
                "fixed inset-x-0 top-0 z-60 flex h-14 items-center gap-1.5 border-b px-3 shadow-sm",
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
                inputRef={mobileInputRef}
                value={query}
                onChange={setQuery}
                onSubmit={handleSearch}
                placeholder={SEARCH_PLACEHOLDER}
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

      {/* 데스크톱: 검색 입력 알약 */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSearch();
        }}
        className={cn(
          "hidden h-9 items-center rounded-full border py-0 pr-3 pl-3.5 transition-colors sm:flex sm:w-72 md:w-80 lg:w-96",
          "bg-background/80 border-brand/20",
          "focus-within:border-brand/50 focus-within:ring-brand/30 focus-within:ring-2",
          "dark:border-border dark:bg-background/70",
        )}
      >
        <Search className="text-muted-foreground pointer-events-none size-4 shrink-0" />
        <input
          ref={desktopInputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={SEARCH_PLACEHOLDER}
          aria-label={SEARCH_PLACEHOLDER}
          className="placeholder:text-muted-foreground ml-2 h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
      </form>
    </>
  );
}
