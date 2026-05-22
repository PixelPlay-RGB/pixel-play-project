"use client";
// Header에서 검색어를 입력받아 검색 페이지로 이동합니다.
import SearchInput from "@/components/search/search-input";
import { Button } from "@/components/ui/button";
import {
  mobileHeaderSearchTransition,
  mobileHeaderSearchVariants,
} from "@/lib/framer-motion/header-search";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

function resolveSearchPath(query: string) {
  const searchParams = new URLSearchParams({ query });
  return `/chat/search?${searchParams.toString()}`;
}

export default function HeaderSearchForm() {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const isChatRoute = pathname === "/chat" || pathname.startsWith("/chat/");
  const isMobileSearchOpen = mobileOpen && isChatRoute;

  const handleSearch = () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || !isChatRoute) return;
    router.push(resolveSearchPath(trimmedQuery));
    setQuery("");
    setMobileOpen(false);
  };

  const handleClose = () => {
    setMobileOpen(false);
    setQuery("");
  };

  if (!isChatRoute) return null;

  return (
    <>
      <div className="sm:hidden">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setMobileOpen(true)}
          aria-label="채팅방 전체 검색"
          className="text-muted-foreground hover:text-foreground"
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
        placeholder="채팅방 전체 검색"
        className="hidden sm:block sm:w-48 md:w-64"
      />
    </>
  );
}
