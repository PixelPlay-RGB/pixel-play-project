"use client";
// 서버 컴포넌트가 스냅샷 로드에 실패했을 때 쓰는 "다시 시도" 버튼.
// 클라이언트에서 router.refresh()로 RSC를 다시 받아 에러 상태를 회복한다.

import { RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

interface Props {
  label?: string;
  className?: string;
}

export function RetryRefreshButton({ label = "다시 시도", className }: Props) {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => router.refresh()}
      className={className}
    >
      <RotateCw className="size-4" />
      {label}
    </Button>
  );
}
