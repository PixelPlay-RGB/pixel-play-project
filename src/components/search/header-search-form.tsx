"use client";
// Header에서 검색 범위(라이브/채팅)를 직접 선택하고 검색어를 입력해 검색 페이지로 이동합니다.
// 검색 범위는 라우터가 아니라 useSearchScopeStore가 보유하므로 어떤 화면에서도 항상 노출됩니다.
import SearchInput from "@/components/search/search-input";
import SearchScopeSelect from "@/components/search/search-scope-select";
import { Button } from "@/components/ui/button";
import { getSearchScopeConfig } from "@/constants/common/search-scope";
import {
  mobileHeaderSearchTransition,
  mobileHeaderSearchVariants,
} from "@/lib/framer-motion/header-search";
import { cn } from "@/lib/utils";
import { useSearchScopeStore, type SearchScope } from "@/stores/search-scope";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type RefObject } from "react";

export default function HeaderSearchForm() {
  const router = useRouter();
  const scope = useSearchScopeStore((state) => state.scope);
  const setScope = useSearchScopeStore((state) => state.setScope);
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const config = getSearchScopeConfig(scope);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // 스코프 선택 시 드롭다운이 닫히며 트리거로 돌아가는 포커스 이후에 검색 입력으로 옮긴다.
  const handleScopeSelect = (next: SearchScope, target: RefObject<HTMLInputElement | null>) => {
    setScope(next);
    requestAnimationFrame(() => target.current?.focus());
  };

  const handleSearch = () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    const searchParams = new URLSearchParams({ query: trimmedQuery });
    router.push(`${config.path}?${searchParams.toString()}`);
    setQuery("");
    setMobileOpen(false);
  };

  const handleClose = () => {
    setMobileOpen(false);
    setQuery("");
  };

  return (
    <>
      {/* 모바일: 검색 아이콘 → 전체폭 오버레이(스코프 칩 포함) */}
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
              <SearchScopeSelect
                scope={scope}
                onScopeChange={(next) => handleScopeSelect(next, mobileInputRef)}
              />
              <SearchInput
                inputRef={mobileInputRef}
                value={query}
                onChange={setQuery}
                onSubmit={handleSearch}
                placeholder={config.placeholder}
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

      {/* 데스크톱: [스코프 칩 | 검색 입력] 한 알약 */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSearch();
        }}
        className={cn(
          "hidden h-9 items-center rounded-full border py-0 pr-3 pl-1 transition-colors sm:flex sm:w-72 md:w-80 lg:w-96",
          "bg-background/80 border-brand/20",
          "focus-within:border-brand/50 focus-within:ring-brand/30 focus-within:ring-2",
          "dark:border-border dark:bg-background/70",
        )}
      >
        <SearchScopeSelect
          scope={scope}
          onScopeChange={(next) => handleScopeSelect(next, desktopInputRef)}
        />
        <span className="bg-border/70 mx-1.5 h-4 w-px shrink-0" aria-hidden />
        <Search className="text-muted-foreground pointer-events-none size-4 shrink-0" />
        <input
          ref={desktopInputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={config.placeholder}
          aria-label={config.placeholder}
          className="placeholder:text-muted-foreground ml-2 h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
      </form>
    </>
  );
}
