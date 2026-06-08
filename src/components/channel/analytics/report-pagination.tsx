"use client";
// 지난 방송 분석 목록의 페이지를 URL searchParams(?page)로 전환합니다.

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import ListPagination from "@/components/common/list-pagination";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";

interface Props {
  currentPage: number;
  totalPages: number;
}

export function ReportPagination({ currentPage, totalPages }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // 페이지가 1개뿐이면 공통 ListPagination은 렌더를 생략한다.
  // 분석 화면은 "1"을 항상 노출하되, 이동할 곳이 없으므로 이전/다음 없이 단독 표기한다.
  if (totalPages <= 1) {
    return (
      <Pagination className="pt-2">
        <PaginationContent className="gap-1">
          <PaginationItem>
            <PaginationLink
              isActive
              aria-disabled
              tabIndex={-1}
              className="pointer-events-none rounded-xl"
            >
              1
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  }

  function handlePageChange(page: number) {
    const params = new URLSearchParams(searchParams);

    // 1페이지는 파라미터를 비워 URL을 깔끔하게 유지한다(기간 등 다른 파라미터는 보존).
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }

    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  return (
    <ListPagination
      currentPage={currentPage}
      totalPages={totalPages}
      isFetching={isPending}
      onPageChange={handlePageChange}
    />
  );
}
