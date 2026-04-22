"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";

function LinkedToastInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (!searchParams.get("linked")) return;

    toast.success("계정 연동 완료", {
      description: "기존 계정과 소셜 로그인이 연동되었습니다.",
    });

    // 토스트 표시 후 URL에서 파라미터 제거 (새로고침 시 재표시 방지)
    const params = new URLSearchParams(searchParams.toString());
    params.delete("linked");
    const newUrl = params.size > 0 ? `?${params.toString()}` : "/";
    router.replace(newUrl, { scroll: false });
  }, [searchParams, router]);

  return null;
}

export default function LinkedToast() {
  return (
    <Suspense>
      <LinkedToastInner />
    </Suspense>
  );
}
