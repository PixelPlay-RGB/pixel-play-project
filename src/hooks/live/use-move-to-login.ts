"use client";
// 현재 경로를 next 파라미터로 보존해 로그인 페이지로 이동하는 핸들러를 제공합니다.

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createPathWithNext } from "@/utils/common/redirect";

export function useMoveToLogin() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return function moveToLogin() {
    const query = searchParams.toString();
    const next = `${pathname}${query ? `?${query}` : ""}`;
    router.push(createPathWithNext("/auth/login", next));
  };
}
