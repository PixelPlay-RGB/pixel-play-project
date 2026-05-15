// 채팅방 목록 페이지네이션 (shadcn Pagination wrapper)
"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { getPageItems } from "@/utils/pagination";

interface Props {
  currentPage: number;
  totalPages: number;
  isFetching: boolean;
  onPageChange: (page: number) => void;
}

export default function ChatRoomPagination({
  currentPage,
  totalPages,
  isFetching,
  onPageChange,
}: Props) {
  if (totalPages <= 1) return null;

  const items = getPageItems(currentPage, totalPages);

  const handlePageClick = (e: React.MouseEvent, page: number) => {
    e.preventDefault();
    if (isFetching) return;
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  const handlePrevious = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isFetching) return;
    if (currentPage <= 1) {
      onPageChange(totalPages);
      return;
    }
    onPageChange(currentPage - 1);
  };

  // 마지막 페이지에서 "다음" 클릭 시 page=1로 순환
  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isFetching) return;
    if (currentPage >= totalPages) {
      onPageChange(1);
      return;
    }
    onPageChange(currentPage + 1);
  };

  const isPrevDisabled = isFetching;

  return (
    <Pagination className="pt-2">
      <PaginationContent className="gap-1">
        <PaginationItem>
          <PaginationLink
            href="#"
            onClick={handlePrevious}
            aria-disabled={isPrevDisabled}
            aria-label="Go to previous page"
            size="default"
            className={cn(
              "pl-1.5!",
              "border-border/60 bg-background text-muted-foreground rounded-xl border font-semibold",
              "hover:border-brand/40 hover:bg-brand/10 hover:text-brand",
              "dark:border-border/30 dark:hover:bg-brand/15 dark:bg-zinc-900/50",
              isPrevDisabled && "pointer-events-none opacity-50",
            )}
          >
            {isFetching ? (
              <Spinner data-icon="inline-start" className="size-4" />
            ) : (
              <ChevronLeftIcon data-icon="inline-start" />
            )}
            <span className="hidden sm:block">이전</span>
          </PaginationLink>
        </PaginationItem>
        {items.map((item) =>
          typeof item === "number" ? (
            <PaginationItem key={item}>
              <PaginationLink
                href="#"
                isActive={item === currentPage}
                aria-disabled={isFetching}
                onClick={(e) => handlePageClick(e, item)}
                className={cn(
                  item === currentPage && [
                    "bg-brand shadow-brand/20 rounded-xl font-bold text-white shadow-sm",
                    "hover:bg-brand/90 hover:text-white",
                    "dark:hover:bg-brand/90",
                  ],
                  item !== currentPage && [
                    "text-muted-foreground rounded-xl font-semibold",
                    "hover:bg-brand/10 hover:text-brand",
                    "dark:hover:bg-brand/15",
                  ],
                  isFetching && "pointer-events-none opacity-50",
                )}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationEllipsis className="text-muted-foreground/70" />
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationLink
            href="#"
            onClick={handleNext}
            aria-disabled={isFetching}
            aria-label="Go to next page"
            size="default"
            className={cn(
              "pr-1.5!",
              "border-border/60 bg-background text-muted-foreground rounded-xl border font-semibold",
              "hover:border-brand/40 hover:bg-brand/10 hover:text-brand",
              "dark:border-border/30 dark:hover:bg-brand/15 dark:bg-zinc-900/50",
              isFetching && "pointer-events-none opacity-50",
            )}
          >
            <span className="hidden sm:block">다음</span>
            {isFetching ? (
              <Spinner data-icon="inline-end" className="size-4" />
            ) : (
              <ChevronRightIcon data-icon="inline-end" />
            )}
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
