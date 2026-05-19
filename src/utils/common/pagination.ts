// 현재 페이지 / 전체 페이지로부터 표시할 항목 배열을 계산하는 순수 함수

import type { PageItem } from "@/types/common/pagination";

/**
 * 페이지네이션 표시 항목 배열을 생성한다.
 * - totalPages <= 5: 모든 페이지
 * - currentPage <= 3: 1 2 3 4 … last
 * - currentPage >= totalPages - 2: 1 … last-3 last-2 last-1 last
 * - 중간: 1 … cur-1 cur cur+1 … last
 */
export function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis-right", totalPages];
  }
  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis-left", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [
    1,
    "ellipsis-left",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis-right",
    totalPages,
  ];
}
